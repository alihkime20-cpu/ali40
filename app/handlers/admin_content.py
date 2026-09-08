import logging
from telegram import Update
from telegram.ext import ContextTypes
from app.services.storage import MANHAJ_BUCKET, MINISTERIAL_BUCKET, StorageService
from app.utils.security import is_admin

logger = logging.getLogger(__name__)

async def admin_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    settings = context.application.bot_data["settings"]
    if not is_admin(update.effective_user, settings.admin_user_id):
        await message.reply_text("عذرًا، رفع الملفات متاح للمدير فقط.")
        return
    document = message.document
    if not document or not document.file_name:
        await message.reply_text("أرسل الملف كمستند Telegram مع اسم المادة في الوصف.")
        return
    if document.file_size and document.file_size > settings.max_file_size_bytes:
        await message.reply_text(f"حجم الملف يتجاوز الحد المسموح ({settings.max_file_size_bytes // 1024 // 1024} MB).")
        return
    parts = [p.strip() for p in (message.caption or "").split("|") if p.strip()]
    if not parts:
        await message.reply_text("أرسل اسم المادة فقط في وصف الملف، مثل: الرياضيات\n\nللملازم اختياريًا: الملازم|الرياضيات")
        return
    kind, subject_name = "ministerial", parts[-1]
    if parts[0] in {"الملازم", "manhaj"}: kind = "manhaj"
    elif parts[0] in {"الوزاريات", "ministerial"}: kind = "ministerial"
    repo = context.application.bot_data["repo"]
    try:
        subjects = repo.find_subjects_all_branches(subject_name)
        if not subjects:
            await message.reply_text(f"لم أجد مادة باسم: {subject_name}\nاكتب الاسم كما يظهر في قائمة المواد."); return
        tg_file = await document.get_file()
        content = bytes(await tg_file.download_as_bytearray())
        bucket = MANHAJ_BUCKET if kind == "manhaj" else MINISTERIAL_BUCKET
        from app.services.file_upload import FileUploadService
        service = FileUploadService(StorageService(repo.client), repo, settings.max_file_size_bytes)
        title = document.file_name.rsplit(".", 1)[0]
        for subject in subjects:
            service.save_file(content=content, filename=document.file_name, bucket=bucket, content_type=document.mime_type, metadata={"kind": kind, "title": title, "description": "ملف شامل لجميع السنوات والأدوار", "branch_id": subject["branch_id"], "subject_id": subject["id"], "year_id": None, "round_id": None, "telegram_file_id": document.file_id})
        await message.reply_text(f"تمت إضافة الملف بنجاح لمادة {subject_name} كملف شامل لجميع السنوات والأدوار.")
    except Exception:
        logger.exception("Simple admin file upload failed")
        await message.reply_text("تعذر حفظ الملف. تحقق من سجلات Railway.")
