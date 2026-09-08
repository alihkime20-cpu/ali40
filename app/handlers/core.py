import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes
from app.handlers.subscription import require_subscription
from app.services.downloader import DownloadError, cleanup, download, extract_url

logger = logging.getLogger(__name__)

def is_owner(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool: return bool(update.effective_user and update.effective_user.id == context.application.bot_data["settings"].admin_user_id)
def admin_markup() -> InlineKeyboardMarkup: return InlineKeyboardMarkup([[InlineKeyboardButton("📊 الإحصائيات", callback_data="admin_stats"), InlineKeyboardButton("📢 القناة", callback_data="admin_channel")], [InlineKeyboardButton("📣 إذاعة", callback_data="admin_broadcast"), InlineKeyboardButton("ℹ️ التعليمات", callback_data="admin_help")]])
def stats_text(context: ContextTypes.DEFAULT_TYPE) -> str:
    stats = context.application.bot_data.setdefault("stats", {"users": set(), "downloads": 0, "errors": 0})
    return f"📊 لوحة تحكم البوت\n\n👥 المستخدمون: {len(stats['users'])}\n⬇️ التنزيلات الناجحة: {stats['downloads']}\n⚠️ الأخطاء: {stats['errors']}"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_subscription(update, context): return
    context.application.bot_data.setdefault("stats", {"users": set(), "downloads": 0, "errors": 0})["users"].add(update.effective_user.id)
    await update.message.reply_text("🎬 بوت تحميل الفيديوهات\n\nأرسل رابط فيديو من TikTok أو Instagram وسأعيده لك.")

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_owner(update, context): await update.message.reply_text("هذا الأمر متاح للمدير فقط."); return
    await update.message.reply_text(stats_text(context), reply_markup=admin_markup())

async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if not is_owner(update, context): await query.answer("غير مصرح لك.", show_alert=True); return
    await query.answer(); settings = context.application.bot_data["settings"]
    if query.data == "admin_stats": await query.edit_message_text(stats_text(context), reply_markup=admin_markup())
    elif query.data == "admin_channel": await query.edit_message_text(f"📢 القناة الإلزامية\n\n{settings.required_channel_url}\n\nالمالك مستثنى بالمعرف: {settings.admin_user_id}", reply_markup=admin_markup())
    elif query.data == "admin_broadcast":
        context.application.bot_data["broadcast_mode"] = True
        await query.edit_message_text("📣 وضع الإذاعة مفعل\n\nأرسل الآن رسالة واحدة، وسيتم إرسالها إلى المستخدمين المسجلين في البوت.", reply_markup=admin_markup())
    else: await query.edit_message_text("ℹ️ أرسل رابط TikTok أو Instagram، وسيحاول البوت تنزيله وإرساله لك.", reply_markup=admin_markup())

async def _broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    context.application.bot_data["broadcast_mode"] = False
    users = context.application.bot_data.setdefault("stats", {"users": set(), "downloads": 0, "errors": 0})["users"]
    sent = failed = 0
    for user_id in users:
        if user_id == update.effective_user.id: continue
        try: await update.message.copy(chat_id=user_id); sent += 1
        except Exception: failed += 1; logger.warning("Broadcast failed for %s", user_id)
    await update.message.reply_text(f"تمت الإذاعة.\n\n✅ تم الإرسال: {sent}\n❌ فشل الإرسال: {failed}", reply_markup=admin_markup())

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if is_owner(update, context) and context.application.bot_data.get("broadcast_mode"):
        await _broadcast(update, context); return
    if not await require_subscription(update, context): return
    stats = context.application.bot_data.setdefault("stats", {"users": set(), "downloads": 0, "errors": 0}); stats["users"].add(update.effective_user.id)
    url = extract_url(update.message.text or "")
    if not url: await update.message.reply_text("أرسل رابط TikTok أو Instagram صالحًا."); return
    settings = context.application.bot_data["settings"]; status = await update.message.reply_text("⏳ جارٍ تنزيل الفيديو..."); path = None
    try:
        path, title, thumbnail = await download(url, settings.max_file_size_bytes, settings.download_timeout_seconds)
        if thumbnail:
            with open(thumbnail, "rb") as image: await update.message.reply_photo(photo=image, caption=f"🎬 {title[:900]}")
        with open(path, "rb") as video: await update.message.reply_video(video=video, caption=f"🎬 {title[:900]}", supports_streaming=True)
        stats["downloads"] += 1; await status.delete()
    except DownloadError as exc: stats["errors"] += 1; await status.edit_text(f"❌ {exc}")
    except Exception:
        stats["errors"] += 1; logger.exception("Video delivery failed"); await status.edit_text("❌ تعذر إرسال الفيديو. قد يكون حجمه أكبر من حد Telegram.")
    finally:
        if path: cleanup(path)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_subscription(update, context): return
    await update.message.reply_text("أرسل رابطًا من TikTok أو Instagram فقط.")

async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE): logger.exception("Unhandled bot error", exc_info=context.error)
