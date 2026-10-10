import logging

from telegram.ext import Application, CommandHandler, MessageHandler, filters

from app.config.settings import get_settings
from app.handlers.core import (
    add_part_command,
    cancel_add_command,
    catalog_command,
    handle_message,
    handle_photo,
    help_command,
    on_error,
    start,
)
from app.services.catalog import CatalogStore

logger = logging.getLogger(__name__)


def main():
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    app = Application.builder().token(settings.telegram_bot_token).build()
    app.bot_data["settings"] = settings

    catalog_store = None
    if settings.supabase_url and settings.supabase_service_role_key:
        try:
            catalog_store = CatalogStore(
                settings.supabase_url, settings.supabase_service_role_key
            )
        except Exception as exc:
            logger.warning("Supabase catalog unavailable (%s)", type(exc).__name__)
    else:
        logger.warning("Supabase environment is missing; product name catalog is unavailable")
    app.bot_data["catalog_store"] = catalog_store

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("addpart", add_part_command))
    app.add_handler(CommandHandler("catalog", catalog_command))
    app.add_handler(CommandHandler("cancel", cancel_add_command))
    app.add_handler(MessageHandler(filters.PHOTO | filters.Document.IMAGE, handle_photo))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(on_error)

    logger.info("Private image-and-name car-part catalog bot is starting")
    app.run_polling(allowed_updates=["message"])


if __name__ == "__main__":
    main()
