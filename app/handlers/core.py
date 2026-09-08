import logging
from telegram import Update
from telegram.ext import ContextTypes
from app.handlers.subscription import require_subscription
from app.services.downloader import DownloadError, cleanup, download, extract_url

logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_subscription(update, context): return
    await update.message.reply_text("🎬 بوت تحميل الفيديوهات\n\nأرسل رابط فيديو من TikTok أو Instagram وسأعيده لك.")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_subscription(update, context): return
    text = update.message.text or ""; url = extract_url(text)
    if not url: await update.message.reply_text("أرسل رابط TikTok أو Instagram صالحًا."); return
    settings = context.application.bot_data["settings"]
    status = await update.message.reply_text("⏳ جارٍ تنزيل الفيديو..."); path = None
    try:
        path, title, thumbnail = await download(url, settings.max_file_size_bytes, settings.download_timeout_seconds)
        if thumbnail:
            with open(thumbnail, "rb") as image: await update.message.reply_photo(photo=image, caption=f"🎬 {title[:900]}")
        with open(path, "rb") as video: await update.message.reply_video(video=video, caption=f"🎬 {title[:900]}", supports_streaming=True)
        await status.delete()
    except DownloadError as exc: await status.edit_text(f"❌ {exc}")
    except Exception:
        logger.exception("Video delivery failed"); await status.edit_text("❌ تعذر إرسال الفيديو. قد يكون حجمه أكبر من حد Telegram.")
    finally:
        if path: cleanup(path)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await require_subscription(update, context): return
    await update.message.reply_text("أرسل رابطًا من TikTok أو Instagram فقط.")

async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE): logger.exception("Unhandled bot error", exc_info=context.error)
