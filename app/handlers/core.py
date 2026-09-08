import logging
from telegram import Update
from telegram.ext import ContextTypes
from app.keyboards.menus import admin_menu, student_menu
from app.utils.security import is_admin

logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    repo = context.application.bot_data["repo"]
    settings = context.application.bot_data["settings"]
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
    await update.message.reply_text("استخدم /start للعودة إلى القائمة الرئيسية أو /search للبحث عن ملف.")

async def callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.data.startswith("admin:") and not is_admin(update.effective_user, context.application.bot_data["settings"].admin_user_id):
        await query.edit_message_text("عذرًا، ليس لديك صلاحية تنفيذ هذه العملية.")
        return
    if query.data == "about":
        await query.edit_message_text("🎓 مساعد السادس العراقي\nبوت لتنظيم الملازم والأسئلة الوزارية لطلبة السادس.")
    elif query.data.startswith("admin:"):
        await query.edit_message_text("هذه الوحدة الإدارية جاهزة لإضافة وإدارة المحتوى من خلال أوامر المدير الآمنة.")
    elif query.data == "favorites":
        rows = context.application.bot_data["repo"].list_favorites(update.effective_user.id)
        text = "⭐ المفضلة\n\n" + ("\n".join(f"• {r.get('files', {}).get('title', 'ملف')}" for r in rows) if rows else "لا توجد مفضلات بعد.")
        await query.edit_message_text(text)
    elif query.data == "search":
        await query.edit_message_text("أرسل كلمة البحث الآن باستخدام الأمر /search كلمة البحث")
    else:
        await query.edit_message_text("اختر الفرع أو أرسل /start للعودة للقائمة الرئيسية.")

async def search_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    term = " ".join(context.args).strip()
    if not term:
        await update.message.reply_text("استخدم: /search اسم الملزمة")
        return
    rows = context.application.bot_data["repo"].search(term)
    if not rows:
        await update.message.reply_text("لم يتم العثور على نتائج.")
        return
    await update.message.reply_text("🔍 النتائج:\n\n" + "\n".join(f"• {r['title']}" for r in rows))
