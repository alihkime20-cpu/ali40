import logging
from telegram import Update
from telegram.ext import ContextTypes
from app.services.storage import MANHAJ_BUCKET, MINISTERIAL_BUCKET, StorageService
from app.utils.security import is_admin, validate_pdf

logger = logging.getLogger(__name__)

async def admin_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    settings = context.application.bot_data["settings"]
    if not is_admin(update.effective_user, settings.admin_user_id):
        await update.message.reply_text("عذرًا، رفع الملفات متاح للمدير فقط.")
        return
    document = update.message.document
    valid, error = validate_pdf(document.file_name, document.file_size, settings.max_file_size_bytes)
    if not valid:
        await update.message.reply_text(error); return
    parts = [p.strip() for p in (update.message.caption or "").split("|")]
    if len(parts) < 7:
        await update.message.reply_text("صيغة الرفع: النوع|الفرع|المادة|السنة|الدور|العنوان|الوصف\nالنوع: manhaj أو ministerial")
        return
    kind, branch_name, subject_name, year_text, round_name, title, description = parts[:7]
    if kind not in {"manhaj", "ministerial"}:
        await update.message.reply_text("النوع يجب أن يكون manhaj أو ministerial."); return
    repo = context.application.bot_data["repo"]
    branches = repo.find_branch(branch_name)
    if not branches: await update.message.reply_text("الفرع غير موجود في الكتالوج."); return
    subjects = repo.find_subject(branches[0]["id"], subject_name)
    year = repo.find_year(int(year_text)) if year_text.isdigit() else []
    round_row = repo.find_round(round_name)
    if not subjects or not year or not round_row:
        await update.message.reply_text("تأكد من اسم المادة والسنة والدور كما هو مسجل في البوت."); return
    tg_file = await document.get_file()
    content = bytes(await tg_file.download_as_bytearray())
    storage = StorageService(repo.client)
    bucket = MANHAJ_BUCKET if kind == "manhaj" else MINISTERIAL_BUCKET
    from app.services.file_upload import FileUploadService
    service = FileUploadService(storage, repo, settings.max_file_size_bytes)
    row = service.save_pdf(content=content, filename=document.file_name, bucket=bucket, metadata={"kind": kind, "title": title, "description": description, "branch_id": branches[0]["id"], "subject_id": subjects[0]["id"], "year_id": year[0]["id"], "round_id": round_row[0]["id"], "telegram_file_id": document.file_id})
    await update.message.reply_text(f"تمت إضافة الملف بنجاح: {row['title']}")
