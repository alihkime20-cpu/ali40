import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes
from app.keyboards.menus import admin_menu, student_menu
from app.services.news import sync_news
from app.utils.security import is_admin

logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user; repo, settings = context.application.bot_data["repo"], context.application.bot_data["settings"]
    repo.upsert_user(user.id, user.username, user.first_name, user.last_name)
    if is_admin(user, settings.admin_user_id): await update.message.reply_text("🔐 لوحة الإدارة\n\nاختر العملية المطلوبة:", reply_markup=admin_menu())
    else: await update.message.reply_text("🎓 مساعد السادس العراقي\n\nاختر ما تريد:", reply_markup=student_menu())

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user, context.application.bot_data["settings"].admin_user_id): await update.message.reply_text("عذرًا، هذا الأمر متاح للمدير فقط."); return
    await update.message.reply_text("🔐 لوحة الإدارة", reply_markup=admin_menu())

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE): await update.message.reply_text("استخدم /start للقائمة الرئيسية أو /search كلمة للبحث.")

async def _branches(kind, query, repo):
    buttons = [[InlineKeyboardButton(r["name"], callback_data=f"branch:{kind}:{r['id']}")] for r in repo.list_branches()]
    await query.edit_message_text("اختر الفرع:", reply_markup=InlineKeyboardMarkup(buttons))

async def _admin_section(query, section):
    instructions = {
        "manhaj": "📚 إدارة الملازم\n\nأرسل ملف PDF مع الوصف التالي:\nmanhaj|الفرع|المادة|السنة|الدور|اسم الملزمة|وصف مختصر",
        "ministerial": "📝 إدارة الوزاريات\n\nأرسل ملف PDF مع الوصف التالي:\nministerial|الفرع|المادة|السنة|الدور|عنوان الأسئلة|وصف مختصر",
        "subjects": "📖 إدارة المواد\n\nالمواد الأساسية مضافة من قاعدة البيانات، ويمكن توسيعها عبر migration مستقبلية.",
        "branches": "🎓 إدارة الفروع\n\nالفروع الحالية: السادس العلمي والسادس الأدبي.",
        "users": "👥 المستخدمون\n\nيتم تسجيل المستخدمين تلقائيًا عند استخدام /start.",
        "stats": "📊 الإحصائيات\n\nيمكن متابعة أعداد الملفات والمستخدمين من قاعدة Supabase.",
        "news": "📰 أخبار التربية\n\nالمزامنة تعمل تلقائيًا كل 30 دقيقة من القناة الرسمية.",
    }
    await query.edit_message_text(instructions.get(section, "لوحة الإدارة"))

async def _admin_content(query, repo, kind: str):
    rows = repo.list_all_files(kind) if hasattr(repo, "list_all_files") else []
    title = "📚 الملازم" if kind == "manhaj" else "📝 الأسئلة الوزارية"
    external_category = "resource" if kind == "manhaj" else "ministerial"
    links = repo.list_external_resources(external_category) if hasattr(repo, "list_external_resources") else []
    buttons = [[InlineKeyboardButton(row["title"], callback_data=f"file:{row['id']}")] for row in rows]
    buttons += [[InlineKeyboardButton(f"🔗 {link['title']}", url=link["url"])] for link in links]
    if not buttons:
        await query.edit_message_text(f"{title}\n\nلا توجد ملفات أو روابط مضافة بعد.\n\nأرسل PDF للمدير مع الوصف المطلوب لإضافته.")
        return
    text = f"{title}\n\n"
    if rows: text += f"📄 الملفات المرفوعة: {len(rows)}\n"
    if links: text += f"🔗 الروابط الخارجية: {len(links)}\n"
    text += "\nاختر المحتوى لفتحه:"
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(buttons))

async def _show_news(query, repo):
    rows = repo.list_news(10)
    if not rows: await query.edit_message_text("لا توجد أخبار منشورة حاليًا."); return
    text = "📰 أخبار التربية\n\n" + "\n\n".join(f"• {r['title']}\n{r.get('source_url', '')}" for r in rows)
    await query.edit_message_text(text[:3900])

async def _show_external_resources(query, repo, category: str):
    rows = repo.list_external_resources(category)
    if not rows:
        await query.edit_message_text("لا توجد روابط مضافة حاليًا.")
        return
    label = "📝 الأسئلة الوزارية" if category == "ministerial" else "🔗 الموارد التعليمية"
    buttons = [[InlineKeyboardButton(r["title"], url=r["url"])] for r in rows]
    await query.edit_message_text(f"{label}\n\nاضغط على الرابط لفتح المصدر الأصلي:", reply_markup=InlineKeyboardMarkup(buttons))

async def callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query; await query.answer()
    repo, settings, data = context.application.bot_data["repo"], context.application.bot_data["settings"], query.data
    if data.startswith("admin:") and query.from_user.id != settings.admin_user_id: await query.edit_message_text("عذرًا، ليس لديك صلاحية تنفيذ هذه العملية."); return
    if data == "about": await query.edit_message_text("🎓 مساعد السادس العراقي\nبوت لتنظيم الملازم والأسئلة الوزارية وأخبار وزارة التربية.")
    elif data.startswith("admin:"):
        if data == "admin:news": await query.edit_message_text(f"📰 تمت مزامنة {len(sync_news(repo))} خبر من المصدر الرسمي.")
        elif data == "admin:manhaj": await _admin_content(query, repo, "manhaj")
        elif data == "admin:ministerial": await _admin_content(query, repo, "ministerial")
        else: await _admin_section(query, data.split(":", 1)[1])
    elif data == "news": await _show_news(query, repo)
    elif data in ("links:resource", "links:ministerial"): await _show_external_resources(query, repo, data.split(":", 1)[1])
    elif data == "favorites":
        rows = repo.list_favorites(query.from_user.id); text = "⭐ المفضلة\n\n" + ("\n".join(f"• {r.get('files', {}).get('title', 'ملف')}" for r in rows) if rows else "لا توجد مفضلات بعد."); await query.edit_message_text(text)
    elif data == "search": await query.edit_message_text("استخدم الأمر /search ثم اكتب عنوان الملف.")
    elif data in ("branches:manhaj", "branches:ministerial"): await _branches(data.split(":")[1], query, repo)
    elif data.startswith("branch:"):
        _, kind, branch_id = data.split(":", 2); buttons = [[InlineKeyboardButton(r["name"], callback_data=f"subject:{kind}:{branch_id}:{r['id']}")] for r in repo.list_subjects(branch_id)]; await query.edit_message_text("اختر المادة:", reply_markup=InlineKeyboardMarkup(buttons))
    elif data.startswith("subject:"):
        _, kind, branch_id, subject_id = data.split(":", 3); buttons = [[InlineKeyboardButton(str(r["year"]), callback_data=f"year:{kind}:{branch_id}:{subject_id}:{r['id']}")] for r in repo.list_years()]; await query.edit_message_text("اختر السنة:", reply_markup=InlineKeyboardMarkup(buttons))
    elif data.startswith("year:"):
        _, kind, branch_id, subject_id, year_id = data.split(":", 4); buttons = [[InlineKeyboardButton(r["name"], callback_data=f"round:{kind}:{branch_id}:{subject_id}:{year_id}:{r['id']}")] for r in repo.list_rounds()]; await query.edit_message_text("اختر الدور:", reply_markup=InlineKeyboardMarkup(buttons))
    elif data.startswith("round:"):
        _, kind, branch_id, subject_id, year_id, round_id = data.split(":", 5); rows = repo.list_files(kind, branch_id, subject_id, year_id, round_id)
        if not rows: await query.edit_message_text("لا توجد ملفات مضافة حاليًا."); return
        await query.edit_message_text("اختر الملف:", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton(r["title"], callback_data=f"file:{r['id']}")] for r in rows]))
    elif data.startswith("file:"):
        row = repo.get_file(data.split(":", 1)[1]);
        if row and row.get("telegram_file_id"): await context.bot.send_document(query.from_user.id, row["telegram_file_id"])
        else: await query.edit_message_text("الملف متاح، وسيتم إرسال رابط آمن عند تفعيل التخزين.")
    else: await query.edit_message_text("اختر من القائمة أو أرسل /start.")

async def search_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    term = " ".join(getattr(context, "args", [])).strip(); rows = context.application.bot_data["repo"].search(term)
    if not term: await update.message.reply_text("استخدم: /search اسم الملزمة")
    elif not rows: await update.message.reply_text("لم يتم العثور على نتائج.")
    else: await update.message.reply_text("🔍 النتائج:\n\n" + "\n".join(f"• {r['title']}" for r in rows))

async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.exception("Unhandled bot error", exc_info=context.error)
    if isinstance(update, Update) and update.effective_message: await update.effective_message.reply_text("حدث خطأ غير متوقع، حاول مرة أخرى.")
