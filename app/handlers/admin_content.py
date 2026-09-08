import logging
import re
from telegram import Update
from telegram.ext import ContextTypes
from app.services.storage import MANHAJ_BUCKET, MINISTERIAL_BUCKET, StorageService
from app.utils.security import is_admin

logger = logging.getLogger(__name__)


def detect_kind(filename: str) -> str:
    text = filename.lower()
    return "manhaj" if any(word in text for word in ("ملزمة", "ملازم", "شرح", "مراجعة")) else "ministerial"


def detect_subject(filename: str, subjects: list[dict]) -> str | None:
    normalized = re.sub(r"[_\-().]+", " ", filename)
    matches = [row["name"] for row in subjects if row["name"] != "عام" and row["name"] in normalized]
    return max(matches, key=len) if matches else None

async def admin_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message; settings = context.application.bot_data["settings"]
    if not is_admin(update.effective_user, settings.admin_user_id):
        await message.reply_text("عذرًا، رفع الملفات متاح للمدير فقط."); return
    document = message.document
    if not document or not document.file_name:
        await message.reply_text("أرسل الملف كمستند Telegram."); return
    if document.file_size and document.file_size > settings.max_file_size_bytes:
        await message.reply_text(f"حجم الملف يتجاوز الحد المسموح ({settings.max_file_size_bytes // 1024 // 1024} MB)."); return
    repo = context.application.bot_data["repo"]
    try:
        all_subjects = repo.list_all_subjects()
        caption = (message.caption or "").strip()
        subject_name = caption.split("|", 1)[-1].strip() if caption else detect_subject(document.file_name, all_subjects)
        if not subject_name: subject_name = "عام"
        subjects = [row for row in all_subjects if row["name"] == subject_name]
        if not subjects: subjects = [row for row in all_subjects if row["name"] == "عام"]
        if not subjects:
            await message.reply_text("لا توجد مادة عامة في قاعدة البيانات. أعد تشغيل migration الكتالوج."); return
        kind = detect_kind(document.file_name)
        if caption.startswith("الملازم|") or caption.startswith("manhaj|"): kind = "manhaj"
        tg_file = await document.get_file(); content = bytes(await tg_file.download_as_bytearray())
        from app.services.file_upload import FileUploadService
        service = FileUploadService(StorageService(repo.client), repo, settings.max_file_size_bytes)
        title = document.file_name.rsplit(".", 1)[0]
        for subject in subjects:
            service.save_file(content=content, filename=document.file_name, bucket=MANHAJ_BUCKET if kind == "manhaj" else MINISTERIAL_BUCKET, content_type=document.mime_type, metadata={"kind": kind, "title": title, "description": "ملف مصنف تلقائيًا من اسم الملف", "branch_id": subject["branch_id"], "subject_id": subject["id"], "year_id": None, "round_id": None, "telegram_file_id": document.file_id})
        await message.reply_text(f"تمت إضافة الملف تلقائيًا إلى قسم {('الملازم' if kind == 'manhaj' else 'الأسئلة الوزارية')}، المادة: {subject_name}.")
    except Exception:
        logger.exception("Automatic admin file upload failed")
        await message.reply_text("تعذر حفظ الملف. تحقق من سجلات Railway.")
