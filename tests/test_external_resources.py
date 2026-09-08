from types import SimpleNamespace
import pytest
from app.handlers.core import callback

class Query:
    def __init__(self, data): self.data, self.from_user, self.text, self.reply_markup = data, SimpleNamespace(id=1), "", None
    async def answer(self): pass
    async def edit_message_text(self, text, **kwargs): self.text, self.reply_markup = text, kwargs.get("reply_markup")

class Repo:
    def list_external_resources(self, category):
        return [{"title": "رابط أصلي", "url": "https://example.com", "source_name": "مصدر"}]

@pytest.mark.asyncio
@pytest.mark.parametrize("data, title", [("links:resource", "الموارد"), ("links:ministerial", "الوزارية")])
async def test_external_links_are_displayed(data, title):
    q = Query(data)
    ctx = SimpleNamespace(application=SimpleNamespace(bot_data={"repo": Repo(), "settings": SimpleNamespace(admin_user_id=7112435274)}))
    await callback(SimpleNamespace(callback_query=q), ctx)
    assert title in q.text
    assert q.reply_markup.inline_keyboard[0][0].url == "https://example.com"
