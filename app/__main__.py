import logging
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, MessageHandler, filters
from app.config.settings import get_settings
from app.handlers.core import admin_callback, admin_command, handle_message, help_command, on_error, start

def main():
    settings = get_settings()
    logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    app = Application.builder().token(settings.telegram_bot_token).build()
    app.bot_data["settings"] = settings
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(admin_callback, pattern="^admin_(stats|channel|help)$"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(on_error)
    app.run_polling(allowed_updates=["message", "callback_query"])

if __name__ == "__main__": main()
