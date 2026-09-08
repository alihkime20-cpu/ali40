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
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def parse_official_news(page: str) -> list[dict]:
    results = []
    pattern = re.compile(r'<div class="tgme_widget_message_text[^>]*>(.*?)</div>', re.S)
    for index, match in enumerate(pattern.finditer(page)):
        raw = match.group(1)
        text = re.sub(r"<br\s*/?>", "\n", raw)
        text = re.sub(r"<[^>]+>", "", text)
        text = html.unescape(re.sub(r"\s+", " ", text)).strip()
        if len(text) < 25: continue
        context = page[max(0, match.start() - 1800):match.start()]
        post_match = re.search(r'data-post="Educationiq/(\d+)"', context)
        source_url = f"https://t.me/Educationiq/{post_match.group(1)}" if post_match else f"{SOURCE_URL}#post-{index}"
        results.append({"title": text.split("\n", 1)[0][:180], "summary": text[:1000], "source_url": source_url, "source_name": SOURCE_NAME, "published_at": datetime.now(timezone.utc).isoformat()})
    return results[:20]


def sync_news(repository) -> int:
    try:
        rows = parse_official_news(_fetch_page())
        return repository.upsert_news(rows)
    except Exception:
        logger.exception("Education news sync failed")
        return 0

async def news_loop(repository, interval_seconds: int = 1800):
    while True:
        await asyncio.to_thread(sync_news, repository)
        await asyncio.sleep(interval_seconds)
