from telegram import InlineKeyboardButton, InlineKeyboardMarkup

def student_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📚 الملازم", callback_data="branches:manhaj"), InlineKeyboardButton("📝 الأسئلة الوزارية", callback_data="branches:ministerial")],
        [InlineKeyboardButton("⭐ المفضلة", callback_data="favorites"), InlineKeyboardButton("🔍 البحث", callback_data="search")],
        [InlineKeyboardButton("📰 أخبار التربية", callback_data="news"), InlineKeyboardButton("ℹ️ حول البوت", callback_data="about")],
    ])

def admin_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📚 إدارة الملازم", callback_data="admin:manhaj"), InlineKeyboardButton("📝 إدارة الوزاريات", callback_data="admin:ministerial")],
        [InlineKeyboardButton("📖 إدارة المواد", callback_data="admin:subjects"), InlineKeyboardButton("🎓 إدارة الفروع", callback_data="admin:branches")],
        [InlineKeyboardButton("👥 المستخدمون", callback_data="admin:users"), InlineKeyboardButton("📊 الإحصائيات", callback_data="admin:stats")],
        [InlineKeyboardButton("📰 مزامنة أخبار التربية", callback_data="admin:news")],
    ])
