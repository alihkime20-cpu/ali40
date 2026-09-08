import logging
from telegram.ext import Application, CallbackQueryHandler, CommandHandler
from app.config.settings import get_settings
from app.database.repository import Repository
from app.handlers.core import admin_command, callback, help_command, search_command, start

def main():
    settings = get_settings()
    logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    app = Application.builder().token(settings.telegram_bot_token).build()
    app.bot_data["settings"] = settings
    app.bot_data["repo"] = Repository(settings.supabase_url, settings.supabase_service_role_key)
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("search", search_command))
    app.add_handler(CallbackQueryHandler(callback))
    app.run_polling(allowed_updates=["message", "callback_query"])

if __name__ == "__main__": main()
