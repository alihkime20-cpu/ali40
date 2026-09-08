import asyncio
import html
import logging
import re
from datetime import datetime, timezone
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)
SOURCE_NAME = "وزارة التربية العراقية"
SOURCE_URL = "https://t.me/s/Educationiq"

def _fetch_page() -> str:
    request = Request(SOURCE_URL, headers={"User-Agent": "iraqi-sixth-bot/1.0"})
    with urlopen(request, timeout=20) as response: return response.read().decode("utf-8", errors="replace")

def parse_official_news(page: str) -> list[dict]:
    results = []
    pattern = re.compile(r'<div class="tgme_widget_message_text[^>]*>(.*?)</div>', re.S)
    for index, match in enumerate(pattern.finditer(page)):
        text = re.sub(r"<br\s*/?>", "\n", match.group(1)); text = re.sub(r"<[^>]+>", "", text)
        text = html.unescape(re.sub(r"\s+", " ", text)).strip()
        if len(text) < 25: continue
        context = page[max(0, match.start() - 1800):match.start()]; post = re.search(r'data-post="Educationiq/(\d+)"', context)
        source_url = f"https://t.me/Educationiq/{post.group(1)}" if post else f"{SOURCE_URL}#post-{index}"
        results.append({"title": text.split("\n", 1)[0][:180], "summary": text[:1000], "source_url": source_url, "source_name": SOURCE_NAME, "published_at": datetime.now(timezone.utc).isoformat()})
    return results[:20]

def sync_news(repository) -> list[dict]:
    try: return repository.upsert_news(parse_official_news(_fetch_page()))
    except Exception: logger.exception("Education news sync failed"); return []

async def news_loop(repository, bot=None, interval_seconds: int = 1800):
    while True:
        new_rows = await asyncio.to_thread(sync_news, repository)
        if bot and new_rows:
            for news in new_rows:
                text = f"📰 خبر جديد من وزارة التربية\n\n{news['title']}\n\n{news['source_url']}"
                for user in repository.notification_users():
                    try:
                        await bot.send_message(user["telegram_user_id"], text)
                        repository.mark_news_delivered(news["id"], user["id"])
                    except Exception: logger.warning("Could not deliver education news", exc_info=True)
        await asyncio.sleep(interval_seconds)
