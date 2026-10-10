import asyncio
import logging
import time

from telegram import Update
from telegram.ext import ContextTypes

from app.services.car_parts import (
    CarPartAnalysisError,
    format_catalog_result,
    match_catalog_image,
)
from app.services.catalog import CatalogError, CatalogStore, MIME_EXTENSIONS

logger = logging.getLogger(__name__)


def is_owner(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    user = update.effective_user
    return bool(
        user
        and user.id == context.application.bot_data["settings"].admin_user_id
    )


async def require_owner(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    if is_owner(update, context):
        return True
    message = update.effective_message
    if message:
        await message.reply_text("هذا بوت خاص، واستخدامه متاح للمالك فقط.")
    return False


def get_catalog_store(context: ContextTypes.DEFAULT_TYPE) -> CatalogStore | None:
    return context.application.bot_data.get("catalog_store")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    await update.effective_message.reply_text(
        "مرحبًا بك في كتالوج قطع غيار السيارات الخاص بك.\n\n"
        "لإضافة منتج إلى الكتالوج: أرسل /addpart، ثم صورته المرجعية، "
        "وبعدها اكتب اسمه الكامل ورقم القطعة إن وجد. كرر ذلك لكل منتج.\n\n"
        "للتعرّف على منتج مسجّل: أرسل صورته فقط، وسأطابقها مع الصور والأسماء "
        "المحفوظة وأقرأ ما يظهر عليها من أرقام أو نصوص.\n\n"
        "لعرض المنتجات المسجلة أرسل /catalog، ولإلغاء عملية الإضافة أرسل /cancel.\n\n"
        "صور الكتالوج تحفظ في مخزن خاص على Supabase. تُرسل صورة المطابقة وصور "
        "الكتالوج إلى OpenAI للتحليل، أما صورة الاستعلام فلا تُحفظ في الكتالوج."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    await update.effective_message.reply_text(
        "طريقة الاستخدام:\n"
        "• أرسل صورة فقط لمطابقتها مع منتجاتك المحفوظة.\n"
        "• لإضافة منتج: /addpart ثم أرسل الصورة المرجعية، ثم الاسم الكامل.\n"
        "• يمكنك كتابة البيانات بهذا التنسيق: الاسم الكامل | رقم القطعة | التفاصيل.\n"
        "• /catalog لعرض الكتالوج، و/cancel لإلغاء إضافة جارية.\n\n"
        "لا يوجد اشتراك قناة. يقتصر الاستخدام على معرف المالك المضبوط في الإعدادات."
    )


async def add_part_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    if not get_catalog_store(context):
        await update.effective_message.reply_text(
            "كتالوج الصور غير متصل بـ Supabase. يلزم ضبط SUPABASE_URL "
            "وSUPABASE_SERVICE_ROLE_KEY في بيئة الاستضافة."
        )
        return
    context.user_data["catalog_add"] = {"step": "image"}
    await update.effective_message.reply_text(
        "أرسل الآن صورة مرجعية واحدة للمنتج (JPEG أو PNG أو WEBP)، "
        "ثم سأطلب الاسم الكامل ورقم القطعة. أرسل /cancel للإلغاء."
    )


async def cancel_add_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    context.user_data.pop("catalog_add", None)
    await update.effective_message.reply_text("تم إلغاء إضافة المنتج.")


def _parse_product_details(text: str) -> tuple[str, str, str]:
    fields = [field.strip() for field in text.split("|", maxsplit=2)]
    full_name = fields[0][:300] if fields else ""
    part_number = fields[1][:120] if len(fields) > 1 else ""
    details = fields[2][:1200] if len(fields) > 2 else ""
    return full_name, part_number, details


async def catalog_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    store = get_catalog_store(context)
    if not store:
        await update.effective_message.reply_text("كتالوج Supabase غير مهيأ.")
        return
    try:
        products = await asyncio.to_thread(store.list_products)
    except CatalogError:
        await update.effective_message.reply_text("تعذر قراءة الكتالوج الآن.")
        return
    if not products:
        await update.effective_message.reply_text(
            "الكتالوج فارغ. أضف أول منتج بالأمر /addpart."
        )
        return
    lines = [f"منتجات الكتالوج ({len(products)}):"]
    for index, product in enumerate(products[:35], start=1):
        number = f" — {product['part_number']}" if product.get("part_number") else ""
        lines.append(f"{index}. {product['full_name']}{number}")
    if len(products) > 35:
        lines.append(f"… وهناك {len(products) - 35} منتجًا آخر.")
    await update.effective_message.reply_text("\n".join(lines))


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    state = context.user_data.get("catalog_add")
    if state and state.get("step") == "name":
        full_name, part_number, details = _parse_product_details(
            update.effective_message.text or ""
        )
        if not full_name:
            await update.effective_message.reply_text(
                "أرسل الاسم الكامل للمنتج، أو استخدم: الاسم | رقم القطعة | التفاصيل."
            )
            return
        store = get_catalog_store(context)
        pending_image = state.get("image_bytes")
        mime_type = state.get("mime_type")
        if not store or not pending_image or not mime_type:
            context.user_data.pop("catalog_add", None)
            await update.effective_message.reply_text(
                "انتهت بيانات الصورة المؤقتة. أعد العملية بالأمر /addpart."
            )
            return
        status = await update.effective_message.reply_text("أحفظ المنتج وصورته المرجعية...")
        try:
            product = await asyncio.to_thread(
                store.add_product,
                full_name=full_name,
                part_number=part_number,
                details=details,
                image_bytes=pending_image,
                mime_type=mime_type,
            )
            context.user_data.pop("catalog_add", None)
            await status.edit_text(
                f"تمت إضافة المنتج إلى الكتالوج.\n"
                f"الاسم: {product['full_name']}\n"
                f"رقم القطعة: {product.get('part_number') or 'غير مسجل'}\n\n"
                "أرسل صورته فقط لاحقًا للمطابقة."
            )
        except CatalogError as exc:
            logger.warning("Could not add catalog product: %s", str(exc))
            await status.edit_text(
                "تعذر حفظ المنتج. أرسل /cancel ثم أعد إضافة الصورة والبيانات."
            )
        return

    await update.effective_message.reply_text(
        "أرسل صورة منتج مسجل للمطابقة، أو أرسل /addpart لإضافة منتج مع اسمه الكامل."
    )


async def _download_telegram_image(message, context) -> tuple[bytes, str]:
    max_bytes = context.application.bot_data["settings"].max_image_size_bytes
    media = message.photo[-1] if message.photo else message.document
    if not media:
        raise CatalogError("لا توجد صورة في الرسالة.")
    mime_type = (
        (message.document.mime_type if message.document else "image/jpeg") or ""
    )
    if mime_type not in MIME_EXTENSIONS:
        raise CatalogError("الصيغة غير مدعومة. أرسل JPEG أو PNG أو WEBP.")
    if media.file_size and media.file_size > max_bytes:
        raise CatalogError("حجم الصورة يتجاوز الحد المضبوط.")
    telegram_file = await context.bot.get_file(media.file_id)
    if telegram_file.file_size and telegram_file.file_size > max_bytes:
        raise CatalogError("حجم الصورة يتجاوز الحد المضبوط.")
    image_bytes = bytes(await telegram_file.download_as_bytearray())
    if not image_bytes or len(image_bytes) > max_bytes:
        raise CatalogError("الصورة فارغة أو أكبر من الحد المضبوط.")
    return image_bytes, mime_type


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    message = update.effective_message
    state = context.user_data.get("catalog_add")

    if state and state.get("step") == "name":
        await message.reply_text(
            "استلمت الصورة. أرسل الآن الاسم الكامل، ويمكنك إضافة رقم القطعة والتفاصيل "
            "بهذا التنسيق: الاسم الكامل | رقم القطعة | التفاصيل."
        )
        return

    try:
        image_bytes, mime_type = await _download_telegram_image(message, context)
    except CatalogError as exc:
        await message.reply_text(str(exc))
        return

    if state and state.get("step") == "image":
        context.user_data["catalog_add"] = {
            "step": "name",
            "image_bytes": image_bytes,
            "mime_type": mime_type,
        }
        await message.reply_text(
            "وصلت الصورة المرجعية. أرسل الآن الاسم الكامل للمنتج، ويمكنك إضافة رقم القطعة "
            "والتفاصيل بهذا التنسيق: الاسم الكامل | رقم القطعة | التفاصيل."
        )
        return

    settings = context.application.bot_data["settings"]
    store = get_catalog_store(context)
    if not store:
        await message.reply_text(
            "كتالوج الصور غير متصل بـ Supabase؛ لا أستطيع المطابقة حتى تُضبط إعدادات الكتالوج."
        )
        return
    if not settings.openai_api_key:
        await message.reply_text(
            "خدمة المطابقة غير مهيأة: يلزم ضبط OPENAI_API_KEY في الاستضافة."
        )
        return

    cooldowns = context.application.bot_data.setdefault("image_analysis_last_at", {})
    now = time.monotonic()
    cooldown = settings.image_analysis_cooldown_seconds
    remaining = cooldown - (now - cooldowns.get(update.effective_user.id, 0.0))
    if remaining > 0:
        await message.reply_text(f"انتظر {int(remaining) + 1} ثانية قبل المطابقة التالية.")
        return
    cooldowns[update.effective_user.id] = now

    status = await message.reply_text("أفحص الصورة وأقارنها بكتالوجك...")
    try:
        result = await match_catalog_image(
            image_bytes,
            query_mime_type=mime_type,
            catalog_store=store,
            api_key=settings.openai_api_key,
            model=settings.car_part_vision_model,
        )
        await status.edit_text(format_catalog_result(result))
    except CarPartAnalysisError as exc:
        logger.warning("Catalog image match failed: %s", str(exc))
        await status.edit_text("تعذر إتمام المطابقة الآن. حاول مرة أخرى بعد قليل.")
    except Exception as exc:
        logger.warning("Catalog lookup failed (%s)", type(exc).__name__)
        await status.edit_text("حدث خطأ في قراءة كتالوج الصور. حاول مرة أخرى لاحقًا.")


async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("Unhandled bot error (%s)", type(context.error).__name__)
