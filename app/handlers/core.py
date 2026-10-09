import logging
import time

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from app.handlers.subscription import require_subscription
from app.services.car_parts import CarPartAnalysisError, analyze_car_part, format_analysis

logger = logging.getLogger(__name__)


def is_owner(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    return bool(
        update.effective_user
        and update.effective_user.id
        == context.application.bot_data["settings"].admin_user_id
    )


def admin_markup() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("📊 الإحصائيات", callback_data="admin_stats"),
                InlineKeyboardButton("🔄 تحديث", callback_data="admin_refresh"),
            ],
            [
                InlineKeyboardButton("📢 القناة", callback_data="admin_channel"),
                InlineKeyboardButton("📣 إذاعة", callback_data="admin_broadcast"),
            ],
            [InlineKeyboardButton("ℹ️ التعليمات", callback_data="admin_help")],
        ]
    )


def stats_text(context: ContextTypes.DEFAULT_TYPE) -> str:
    stats = context.application.bot_data.setdefault(
        "stats", {"users": set(), "image_analyses": 0, "errors": 0}
    )
    store = context.application.bot_data.get("user_store")
    try:
        user_count = len(store.ids()) if store else len(stats["users"])
    except Exception as exc:
        logger.warning("Could not read users from Supabase (%s)", type(exc).__name__)
        user_count = len(stats["users"])
    return (
        "📊 لوحة تحكم البوت\n\n"
        f"👥 المستخدمون: {user_count}\n"
        f"🖼 تحليلات الصور الناجحة: {stats['image_analyses']}\n"
        f"⚠️ الأخطاء: {stats['errors']}"
    )


async def _track_user(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if user:
        stats = context.application.bot_data.setdefault(
            "stats", {"users": set(), "image_analyses": 0, "errors": 0}
        )
        stats["users"].add(user.id)
    store = context.application.bot_data.get("user_store")
    if store and user:
        try:
            store.upsert(user)
        except Exception as exc:
            logger.warning("Could not save Telegram user (%s)", type(exc).__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _track_user(update, context)
    if not await require_subscription(update, context):
        return
    await update.effective_message.reply_text(
        "مرحبًا بك في مساعد التعرّف على قطع غيار السيارات.\n\n"
        "أرسل صورة واضحة للقطعة، ويمكنك إضافة معلومات السيارة في تعليق الصورة "
        "مثل الشركة والموديل وسنة الصنع ورقم المحرك.\n\n"
        "تُرسل الصورة إلى مزود الذكاء الاصطناعي المهيأ للبوت للتحليل، "
        "ولا يحتفظ البوت بنسخة منها. النتيجة تقديرية؛ تحقّق من رقم القطعة "
        "والتوافق قبل الشراء أو التركيب."
    )


async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_owner(update, context):
        await update.effective_message.reply_text("هذا الأمر متاح للمدير فقط.")
        return
    await update.effective_message.reply_text(
        stats_text(context), reply_markup=admin_markup()
    )


async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if not is_owner(update, context):
        await query.answer("غير مصرح لك.", show_alert=True)
        return
    await query.answer()
    settings = context.application.bot_data["settings"]
    if query.data in {"admin_stats", "admin_refresh"}:
        await query.edit_message_text(stats_text(context), reply_markup=admin_markup())
    elif query.data == "admin_channel":
        await query.edit_message_text(
            "📢 القناة الإلزامية\n\n"
            f"{settings.required_channel_url}\n\n"
            f"المالك مستثنى بالمعرف: {settings.admin_user_id}",
            reply_markup=admin_markup(),
        )
    elif query.data == "admin_broadcast":
        context.application.bot_data["broadcast_mode"] = True
        await query.edit_message_text(
            "📣 وضع الإذاعة مفعل\n\n"
            "أرسل الآن رسالة واحدة، وسيتم إرسالها إلى المستخدمين المسجلين في البوت.",
            reply_markup=admin_markup(),
        )
    else:
        await query.edit_message_text(
            "أرسل صورة واضحة لقطعة السيارة، واكتب معلومات السيارة في تعليق الصورة "
            "للمساعدة على التعرّف والتحقق من التوافق.",
            reply_markup=admin_markup(),
        )


async def _broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    context.application.bot_data["broadcast_mode"] = False
    store = context.application.bot_data.get("user_store")
    try:
        users = (
            store.ids()
            if store
            else context.application.bot_data.setdefault(
                "stats", {"users": set(), "image_analyses": 0, "errors": 0}
            )["users"]
        )
    except Exception as exc:
        logger.warning("Could not read broadcast users (%s)", type(exc).__name__)
        users = []
    sent = failed = 0
    for user_id in users:
        if user_id == update.effective_user.id:
            continue
        try:
            await update.effective_message.copy(chat_id=user_id)
            sent += 1
        except Exception:
            failed += 1
            logger.warning("Broadcast delivery failed")
    await update.effective_message.reply_text(
        f"تمت الإذاعة.\n\n✅ تم الإرسال: {sent}\n❌ فشل الإرسال: {failed}",
        reply_markup=admin_markup(),
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if is_owner(update, context) and context.application.bot_data.get("broadcast_mode"):
        await _broadcast(update, context)
        return
    await _track_user(update, context)
    if not await require_subscription(update, context):
        return
    await update.effective_message.reply_text(
        "للتعرّف على قطعة غيار، أرسل صورة واضحة لها. "
        "أضف الشركة والموديل وسنة الصنع أو رقم القطعة في تعليق الصورة."
    )


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    user = update.effective_user
    if not message or not user:
        return

    if is_owner(update, context) and context.application.bot_data.get("broadcast_mode"):
        await _broadcast(update, context)
        return

    await _track_user(update, context)
    stats = context.application.bot_data.setdefault(
        "stats", {"users": set(), "image_analyses": 0, "errors": 0}
    )
    if not await require_subscription(update, context):
        return

    settings = context.application.bot_data["settings"]
    if not settings.openai_api_key:
        await message.reply_text(
            "ميزة التعرّف على القطع غير مهيأة بعد. يلزم ضبط OPENAI_API_KEY "
            "في متغيرات بيئة الاستضافة."
        )
        return

    media = message.photo[-1] if message.photo else message.document
    if not media:
        await message.reply_text("أرسل صورة بصيغة JPEG أو PNG أو WEBP.")
        return
    mime_type = (message.document.mime_type if message.document else "image/jpeg") or ""
    supported_mime_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if mime_type not in supported_mime_types:
        await message.reply_text("صيغة الصورة غير مدعومة. أرسل JPEG أو PNG أو WEBP.")
        return

    max_bytes = settings.max_image_size_bytes
    if media.file_size and media.file_size > max_bytes:
        await message.reply_text(
            f"حجم الصورة أكبر من الحد المسموح ({settings.max_image_size_mb} MB). "
            "أرسل صورة أصغر أو أرسلها كصورة مضغوطة."
        )
        return

    cooldowns = context.application.bot_data.setdefault("image_analysis_last_at", {})
    now = time.monotonic()
    cooldown = settings.image_analysis_cooldown_seconds
    last_request = cooldowns.get(user.id, 0.0)
    remaining = cooldown - (now - last_request)
    if remaining > 0:
        await message.reply_text(f"انتظر {int(remaining) + 1} ثانية قبل تحليل صورة أخرى.")
        return
    cooldowns[user.id] = now
    if len(cooldowns) > 1000:
        context.application.bot_data["image_analysis_last_at"] = {
            user_id: seen_at
            for user_id, seen_at in cooldowns.items()
            if now - seen_at < cooldown
        }

    status = await message.reply_text("🔎 أفحص الصورة الآن...")
    try:
        telegram_file = await context.bot.get_file(media.file_id)
        if telegram_file.file_size and telegram_file.file_size > max_bytes:
            await status.edit_text(
                f"حجم الصورة أكبر من الحد المسموح ({settings.max_image_size_mb} MB)."
            )
            return
        image_bytes = bytes(await telegram_file.download_as_bytearray())
        if not image_bytes:
            await status.edit_text("تعذر تنزيل الصورة من Telegram؛ أعد إرسالها من فضلك.")
            return
        if len(image_bytes) > max_bytes:
            await status.edit_text(
                f"حجم الصورة أكبر من الحد المسموح ({settings.max_image_size_mb} MB)."
            )
            return

        result = await analyze_car_part(
            image_bytes,
            api_key=settings.openai_api_key,
            model=settings.car_part_vision_model,
            caption=message.caption or "",
            mime_type=mime_type,
        )
        stats["image_analyses"] += 1
        await status.edit_text(format_analysis(result))
    except CarPartAnalysisError as exc:
        stats["errors"] += 1
        logger.warning("Car-part image analysis failed: %s", str(exc))
        await status.edit_text("تعذر تحليل الصورة الآن. أعد المحاولة بصورة أوضح بعد قليل.")
    except Exception as exc:
        stats["errors"] += 1
        logger.warning("Car-part image request failed (%s)", type(exc).__name__)
        await status.edit_text(
            "تعذر استلام الصورة أو إرسال نتيجة التحليل. أعد المحاولة بعد قليل."
        )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_subscription(update, context):
        return
    await update.effective_message.reply_text(
        "أرسل صورة واضحة لقطعة السيارة، ويمكنك إضافة معلومات السيارة في تعليقها "
        "مثل الشركة والموديل وسنة الصنع ورقم المحرك.\n\n"
        "الصورة تُرسل إلى مزود الذكاء الاصطناعي المهيأ للبوت للتحليل، "
        "ولا يحتفظ البوت بنسخة منها. النتيجة أولية ولا تؤكد التوافق أو السلامة."
    )


async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("Unhandled bot error (%s)", type(context.error).__name__)
