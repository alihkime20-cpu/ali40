from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ChatMemberStatus
from telegram.ext import ContextTypes

async def is_subscribed(user_id: int, context: ContextTypes.DEFAULT_TYPE) -> bool:
    settings = context.application.bot_data["settings"]
    if user_id == settings.admin_user_id: return True
    try:
        member = await context.bot.get_chat_member(settings.required_channel, user_id)
        return member.status in {ChatMemberStatus.MEMBER, ChatMemberStatus.ADMINISTRATOR, ChatMemberStatus.OWNER}
    except Exception:
        return False

async def require_subscription(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    user = update.effective_user
    if user and await is_subscribed(user.id, context): return True
    settings = context.application.bot_data["settings"]
    markup = InlineKeyboardMarkup([
        [InlineKeyboardButton("📢 اشترك في القناة", url=settings.required_channel_url)],
        [InlineKeyboardButton("✅ تحقق من الاشتراك", callback_data="check_subscription")],
    ])
    message = update.effective_message
    if message: await message.reply_text("🔒 يجب الاشتراك في قناتنا أولًا لاستخدام البوت.", reply_markup=markup)
    return False
