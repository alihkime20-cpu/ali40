import logging

from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    MessageHandler,
    filters,
)

from app.config.settings import get_settings
from app.handlers.core import (
    admin_callback,
    admin_command,
    handle_message,
    handle_photo,
    help_command,
    on_error,
    start,
)
from app.services.users import UserStore

logger = logging.getLogger(__name__)


def main():
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    app = Application.builder().token(settings.telegram_bot_token).build()
    app.bot_data["settings"] = settings

    user_store = None
    if settings.supabase_url and settings.supabase_service_role_key:
        try:
            user_store = UserStore(
                settings.supabase_url, settings.supabase_service_role_key
            )
        except Exception as exc:
            logger.warning(
                "Supabase user storage is unavailable; bot will continue (%s)",
                type(exc).__name__,
            )
    else:
        logger.warning(
            "Supabase credentials are not configured; persistent user storage is disabled"
        )
    app.bot_data["user_store"] = user_store

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(
        CallbackQueryHandler(
            admin_callback,
            pattern="^admin_(stats|refresh|channel|broadcast|help)$",
        )
    )
    app.add_handler(MessageHandler(filters.PHOTO | filters.Document.IMAGE, handle_photo))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(on_error)

    logger.info("Car-part recognition bot is starting in polling mode")
    app.run_polling(allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
