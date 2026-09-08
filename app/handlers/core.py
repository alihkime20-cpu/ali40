import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes
from app.keyboards.menus import admin_menu, student_menu
from app.utils.security import is_admin

logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    repo, settings = context.application.bot_data["repo"], context.application.bot_data["settings"]
    repo.upsert_user(user.id, user.username, user.first_name, user.last_name)
    if is_admin(user, settings.admin_user_id):
        await update.message.reply_text("🔐 لوحة الإدارة\n\nاختر العملية المطلوبة:", reply_markup=admin_menu())
    else:
        await update.message.reply_text("🎓 مساعد السادس العراقي\n\nاختر ما تريد:", reply_markup=student_menu())

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user, context.application.bot_data["settings"].admin_user_id):
        await update.message.reply_text("عذرًا، هذا الأمر متاح للمدير فقط.")
        return
    await update.message.reply_text("🔐 لوحة الإدارة", reply_markup=admin_menu())

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("استخدم /start للقائمة الرئيسية أو /search كلمة للبحث.")

async def _branches(kind: str, query, repo):
    buttons = [[InlineKeyboardButton(row["name"], callback_data=f"branch:{kind}:{row['id']}")] for row in repo.list_branches()]
    await query.edit_message_text("اختر الفرع:", reply_markup=InlineKeyboardMarkup(buttons))

async def callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    repo, settings = context.application.bot_data["repo"], context.application.bot_data["settings"]
    data = query.data
    if data.startswith("admin:") and not is_admin(update.effective_user, settings.admin_user_id):
        await query.edit_message_text("عذرًا، ليس لديك صلاحية تنفيذ هذه العملية.")
        return
    if data == "about":
        await query.edit_message_text("🎓 مساعد السادس العراقي\nبوت لتنظيم الملازم والأسئلة الوزارية.")
    elif data.startswith("admin:"):
        await query.edit_message_text("هذه الوحدة الإدارية محمية وتستقبل عمليات المدير فقط.")
    elif data == "favorites":
        rows = repo.list_favorites(update.effective_user.id)
        text = "⭐ المفضلة\n\n" + ("\n".join(f"• {r.get('files', {}).get('title', 'ملف')}" for r in rows) if rows else "لا توجد مفضلات بعد.")
        await query.edit_message_text(text)
    elif data == "search":
        await query.edit_message_text("استخدم الأمر /search ثم اكتب عنوان الملف.")
    elif data == "branches:manhaj":
        await _branches("manhaj", query, repo)
    elif data == "branches:ministerial":
        await _branches("ministerial", query, repo)
    elif data.startswith("branch:"):
        _, kind, branch_id = data.split(":", 2)
        buttons = [[InlineKeyboardButton(row["name"], callback_data=f"subject:{kind}:{branch_id}:{row['id']}")] for row in repo.list_subjects(branch_id)]
        await query.edit_message_text("اختر المادة:", reply_markup=InlineKeyboardMarkup(buttons))
    elif data.startswith("subject:"):
        _, kind, branch_id, subject_id = data.split(":", 3)
        rows = repo.list_files(kind, branch_id, subject_id)
        if not rows:
            await query.edit_message_text("لا توجد ملفات مضافة حاليًا.")
            return
        buttons = [[InlineKeyboardButton(row["title"], callback_data=f"file:{row['id']}")] for row in rows]
        await query.edit_message_text("اختر الملف:", reply_markup=InlineKeyboardMarkup(buttons))
    elif data.startswith("file:"):
        row = repo.get_file(data.split(":", 1)[1])
        if row and row.get("telegram_file_id"):
            await context.bot.send_document(update.effective_user.id, row["telegram_file_id"])
        else:
            await query.edit_message_text("الملف متاح، وسيتم إرسال رابط آمن عند تفعيل التخزين.")
    else:
        await query.edit_message_text("اختر من القائمة أو أرسل /start.")

async def search_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    term = " ".join(getattr(context, "args", [])).strip()
    rows = context.application.bot_data["repo"].search(term)
    if not term:
        await update.message.reply_text("استخدم: /search اسم الملزمة")
    elif not rows:
        await update.message.reply_text("لم يتم العثور على نتائج.")
    else:
        await update.message.reply_text("🔍 النتائج:\n\n" + "\n".join(f"• {r['title']}" for r in rows))

async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.exception("Unhandled bot error", exc_info=context.error)
    if isinstance(update, Update) and update.effective_message:
        await update.effective_message.reply_text("حدث خطأ غير متوقع، حاول مرة أخرى.")
