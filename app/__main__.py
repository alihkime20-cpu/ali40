import asyncio
import logging
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, MessageHandler, filters
from app.config.settings import get_settings
from app.database.repository import Repository
from app.handlers.admin_content import admin_document
from app.handlers.core import admin_command, callback, help_command, on_error, search_command, start
from app.services.news import news_loop

async def post_init(application: Application):
    application.bot_data["news_task"] = asyncio.create_task(news_loop(application.bot_data["repo"], application.bot))

async def post_shutdown(application: Application):
    task = application.bot_data.get("news_task")
    if task: task.cancel(); await asyncio.gather(task, return_exceptions=True)

def main():
    settings = get_settings(); logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    app = Application.builder().token(settings.telegram_bot_token).post_init(post_init).post_shutdown(post_shutdown).build()
    app.bot_data["settings"] = settings; app.bot_data["repo"] = Repository(settings.supabase_url, settings.supabase_service_role_key)
    app.add_handler(CommandHandler("start", start)); app.add_handler(CommandHandler("admin", admin_command)); app.add_handler(CommandHandler("help", help_command)); app.add_handler(CommandHandler("search", search_command))
    app.add_handler(CallbackQueryHandler(callback)); app.add_handler(MessageHandler(filters.Document.PDF, admin_document)); app.add_error_handler(on_error)
    app.run_polling(allowed_updates=["message", "callback_query"])

if __name__ == "__main__": main()
