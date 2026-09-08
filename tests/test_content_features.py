from types import SimpleNamespace
import pytest
from app.handlers.admin_content import admin_document
from app.handlers.core import callback

class Message:
    def __init__(self): self.sent=[]
    async def reply_text(self, text, **kwargs): self.sent.append(text)

@pytest.mark.asyncio
async def test_news_callback_displays_news():
    class Query:
        data="news"; from_user=SimpleNamespace(id=12)
        async def answer(self): pass
        async def edit_message_text(self, text, **kwargs): self.text=text
    repo=SimpleNamespace(list_news=lambda limit: [{"title":"خبر التربية","source_url":"https://t.me/Educationiq/1"}])
    ctx=SimpleNamespace(application=SimpleNamespace(bot_data={"repo":repo,"settings":SimpleNamespace(admin_user_id=7112435274)}))
    q=Query(); await callback(SimpleNamespace(callback_query=q),ctx)
    assert "خبر التربية" in q.text

@pytest.mark.asyncio
async def test_regular_user_cannot_upload_document():
    msg=Message(); update=SimpleNamespace(effective_user=SimpleNamespace(id=44), message=msg)
    ctx=SimpleNamespace(application=SimpleNamespace(bot_data={"settings":SimpleNamespace(admin_user_id=7112435274)}))
    await admin_document(update,ctx)
    assert "فقط" in msg.sent[0]
