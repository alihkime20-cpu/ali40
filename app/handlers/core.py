import asyncio
import logging
import time

from telegram import Update
from telegram.ext import ContextTypes

from app.services.car_parts import CarPartAnalysisError, format_match, match_product_image
from app.services.catalog import CatalogError, CatalogStore, MIME_EXTENSIONS

logger = logging.getLogger(__name__)


def is_owner(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    user = update.effective_user
    return bool(user and user.id == context.application.bot_data["settings"].admin_user_id)


async def require_owner(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    if is_owner(update, context):
        return True
    if update.effective_message:
        await update.effective_message.reply_text("هذا البوت خاص، واستخدامه متاح للمالك فقط.")
    return False


def get_catalog_store(context: ContextTypes.DEFAULT_TYPE) -> CatalogStore | None:
    return context.application.bot_data.get("catalog_store")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    await update.effective_message.reply_text(
        "مرحبًا بك. أضف كل منتج مرة واحدة بصورة مرجعية والاسم الذي تختاره، "
        "ثم أرسل صورة المنتج فقط كلما أردت معرفة اسمه.\n\n"
        "للإضافة: أرسل /addpart ثم صورة المنتج، وبعدها الاسم فقط. "
        "يمكنك وضع الاسم في تعليق الصورة لتختصر خطوة.\n"
        "للبحث: أرسل صورة المنتج فقط.\n"
        "لعرض الأسماء: /catalog — للإلغاء: /cancel.\n\n"
        "صور المنتجات المرجعية تحفظ في مخزن خاص. تُرسل الصور المرجعية وصورة البحث "
        "إلى مزود الذكاء الاصطناعي للمقارنة."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    await update.effective_message.reply_text(
        "إضافة منتج: /addpart، ثم أرسل صورة مرجعية مع الاسم في تعليقها، "
        "أو أرسل الصورة ثم اكتب الاسم في الرسالة التالية. اكتب الاسم فقط دون تفاصيل.\n"
        "بعد الإضافة، أرسل صورة المنتج فقط ليعيد البوت الاسم المحفوظ.\n"
        "/catalog لعرض الأسماء المسجلة — /cancel لإلغاء إضافة جارية."
    )


async def add_part_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    if not get_catalog_store(context):
        await update.effective_message.reply_text(
            "كتالوج الصور غير متصل بـ Supabase؛ تحقق من SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY."
        )
        return
    context.user_data["catalog_add"] = {"step": "image"}
    await update.effective_message.reply_text(
        "أرسل صورة المنتج مع الاسم في تعليقها، أو أرسل الصورة أولًا ثم الاسم في الرسالة التالية."
    )


async def cancel_add_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    context.user_data.pop("catalog_add", None)
    await update.effective_message.reply_text("تم إلغاء الإضافة.")


async def catalog_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    store = get_catalog_store(context)
    if not store:
        await update.effective_message.reply_text("كتالوج الصور غير مهيأ.")
        return
    try:
        products = await asyncio.to_thread(store.list_products)
    except CatalogError:
        await update.effective_message.reply_text("تعذر قراءة أسماء المنتجات الآن.")
        return
    if not products:
        await update.effective_message.reply_text("لا توجد أسماء مسجلة بعد. استخدم /addpart.")
        return
    names = [product["full_name"] for product in products[:60]]
    if len(products) > 60:
        names.append(f"… ويوجد {len(products) - 60} اسمًا آخر.")
    await update.effective_message.reply_text("الأسماء المسجلة:\n" + "\n".join(f"• {name}" for name in names))


async def _download_image(message, context) -> tuple[bytes, str]:
    settings = context.application.bot_data["settings"]
    max_bytes = settings.max_image_size_bytes
    media = message.photo[-1] if message.photo else message.document
    if not media:
        raise CatalogError("لم أجد صورة في الرسالة.")
    mime_type = (message.document.mime_type if message.document else "image/jpeg") or ""
    if mime_type not in MIME_EXTENSIONS:
        raise CatalogError("الصيغة غير مدعومة. أرسل JPEG أو PNG أو WEBP.")
    if media.file_size and media.file_size > max_bytes:
        raise CatalogError(f"حجم الصورة أكبر من {settings.max_image_size_mb} ميغابايت.")
    telegram_file = await context.bot.get_file(media.file_id)
    image_bytes = bytes(await telegram_file.download_as_bytearray())
    if not image_bytes or len(image_bytes) > max_bytes:
        raise CatalogError(f"الصورة فارغة أو تتجاوز {settings.max_image_size_mb} ميغابايت.")
    return image_bytes, mime_type


async def _save_product(update: Update, context, image_bytes: bytes, mime_type: str, name: str):
    store = get_catalog_store(context)
    if not store:
        await update.effective_message.reply_text("كتالوج الصور غير مهيأ.")
        return
    try:
        product = await asyncio.to_thread(
            store.add_product,
            full_name=name,
            image_bytes=image_bytes,
            mime_type=mime_type,
        )
        context.user_data.pop("catalog_add", None)
        await update.effective_message.reply_text(f"تم حفظ الصورة بالاسم: {product['full_name']}")
    except CatalogError:
        logger.warning("Could not add product reference image")
        await update.effective_message.reply_text("تعذر حفظ الصورة. أعد المحاولة أو أرسل /cancel.")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    state = context.user_data.get("catalog_add")
    if state and state.get("step") == "name":
        name = (update.effective_message.text or "").strip()
        if not name:
            await update.effective_message.reply_text("اكتب اسم المنتج فقط.")
            return
        await _save_product(
            update,
            context,
            state["image_bytes"],
            state["mime_type"],
            name[:300],
        )
        return
    await update.effective_message.reply_text(
        "أرسل صورة مسجلة لأعرف اسمها، أو ابدأ تسجيل صورة واسم جديد بالأمر /addpart."
    )


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_owner(update, context):
        return
    message = update.effective_message
    try:
        image_bytes, mime_type = await _download_image(message, context)
    except CatalogError as exc:
        await message.reply_text(str(exc))
        return

    state = context.user_data.get("catalog_add")
    if state and state.get("step") == "image":
        if message.caption and message.caption.strip():
            await _save_product(update, context, image_bytes, mime_type, message.caption.strip()[:300])
        else:
            context.user_data["catalog_add"] = {
                "step": "name",
                "image_bytes": image_bytes,
                "mime_type": mime_type,
            }
            await message.reply_text("اكتب الاسم الذي تريد حفظه لهذا المنتج فقط.")
        return
    if state and state.get("step") == "name":
        await message.reply_text("وصلت الصورة؛ اكتب الآن اسم المنتج فقط أو أرسل /cancel.")
        return

    settings = context.application.bot_data["settings"]
    store = get_catalog_store(context)
    if not store:
        await message.reply_text("كتالوج الصور غير مهيأ؛ أضف صور المنتجات بعد ضبط Supabase.")
        return
    if not settings.openai_api_key:
        await message.reply_text("خدمة مطابقة الصور غير مهيأة: يلزم ضبط OPENAI_API_KEY.")
        return
    cooldowns = context.application.bot_data.setdefault("image_analysis_last_at", {})
    now = time.monotonic()
    cooldown = settings.image_analysis_cooldown_seconds
    remaining = cooldown - (now - cooldowns.get(update.effective_user.id, 0.0))
    if remaining > 0:
        await message.reply_text(f"انتظر {int(remaining) + 1} ثانية قبل الصورة التالية.")
        return
    cooldowns[update.effective_user.id] = now

    status = await message.reply_text("أقارن الصورة بالمنتجات المسجلة...")
    try:
        result = await match_product_image(
            image_bytes,
            query_mime_type=mime_type,
            catalog_store=store,
            api_key=settings.openai_api_key,
            model=settings.car_part_vision_model,
        )
        await status.edit_text(format_match(result))
    except CarPartAnalysisError as exc:
        logger.warning("Product image matching failed: %s", str(exc))
        await status.edit_text("تعذر إتمام المطابقة الآن. حاول مرة أخرى بعد قليل.")
    except Exception as exc:
        logger.warning("Product catalog lookup failed (%s)", type(exc).__name__)
        await status.edit_text("تعذر قراءة كتالوج الصور. حاول مرة أخرى لاحقًا.")


async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("Unhandled bot error (%s)", type(context.error).__name__)
