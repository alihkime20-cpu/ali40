import logging
from telegram import Update
from telegram.ext import ContextTypes
from app.services.storage import MANHAJ_BUCKET, MINISTERIAL_BUCKET, StorageService
from app.utils.security import is_admin, validate_pdf

logger = logging.getLogger(__name__)

FORMAT_HELP = (
    "صيغة الوصف الصحيحة يجب أن تحتوي على قيم حقيقية، وليس الكلمات: الفرع/المادة/السنة.\n\n"
    "للوزاريات:\nministerial|السادس العلمي|الرياضيات|2025|الدور الأول|أسئلة رياضيات 2025|أسئلة الدور الأول\n\n"
    "للملازم:\nmanhaj|السادس العلمي|الرياضيات|2025|الدور الأول|ملزمة الرياضيات|شرح المادة"
)

async def admin_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    settings = context.application.bot_data["settings"]
    if not is_admin(update.effective_user, settings.admin_user_id):
        await message.reply_text("عذرًا، رفع الملفات متاح للمدير فقط.")
        return
    document = message.document
    valid, error = validate_pdf(document.file_name, document.file_size, settings.max_file_size_bytes)
    if not valid:
        await message.reply_text(error)
        return
    parts = [p.strip() for p in (message.caption or "").split("|")]
    if len(parts) < 7:
        await message.reply_text(FORMAT_HELP)
        return
    kind, branch_name, subject_name, year_text, round_name, title, description = parts[:7]
    if kind not in {"manhaj", "ministerial"}:
        await message.reply_text("النوع غير صحيح. استخدم manhaj للملازم أو ministerial للوزاريات.\n\n" + FORMAT_HELP)
        return
    repo = context.application.bot_data["repo"]
    try:
        branches = repo.find_branch(branch_name)
        if not branches:
            await message.reply_text(f"الفرع غير موجود: {branch_name}\nاستخدم: السادس العلمي أو السادس الأدبي")
            return
        subjects = repo.find_subject(branches[0]["id"], subject_name)
        if not subjects:
            await message.reply_text(f"المادة غير موجودة داخل الفرع: {subject_name}\nافتح إدارة المواد أو استخدم اسم المادة كما يظهر في القائمة.")
            return
        year = repo.find_year(int(year_text)) if year_text.isdigit() else []
        if not year:
            await message.reply_text(f"السنة غير موجودة: {year_text}\nاستخدم سنة رقمية مثل 2025.")
            return
        round_row = repo.find_round(round_name)
        if not round_row:
            await message.reply_text(f"الدور غير موجود: {round_name}\nاستخدم: الدور الأول أو الدور الثاني أو الدور الثالث")
            return
        tg_file = await document.get_file()
        content = bytes(await tg_file.download_as_bytearray())
        storage = StorageService(repo.client)
        bucket = MANHAJ_BUCKET if kind == "manhaj" else MINISTERIAL_BUCKET
        from app.services.file_upload import FileUploadService
        service = FileUploadService(storage, repo, settings.max_file_size_bytes)
        row = service.save_pdf(content=content, filename=document.file_name, bucket=bucket, metadata={"kind": kind, "title": title, "description": description, "branch_id": branches[0]["id"], "subject_id": subjects[0]["id"], "year_id": year[0]["id"], "round_id": round_row[0]["id"], "telegram_file_id": document.file_id})
        await message.reply_text(f"تمت إضافة الملف بنجاح: {row['title']}\nيمكن للطلاب فتحه من قسم {('الملازم' if kind == 'manhaj' else 'الأسئلة الوزارية')}.")
    except Exception:
        logger.exception("Admin PDF upload failed")
        await message.reply_text("تعذر حفظ الملف بسبب خطأ في التخزين أو قاعدة البيانات. راجع سجلات Railway ثم أعد المحاولة.")
