from types import SimpleNamespace
import pytest
from app.handlers.admin_content import admin_document

@pytest.mark.asyncio
async def test_non_admin_upload_is_rejected():
    class Msg:
        document = SimpleNamespace(file_name="x.pdf", file_size=10)
        async def reply_text(self, text): self.text = text
    msg = Msg()
    update = SimpleNamespace(effective_user=SimpleNamespace(id=2), message=msg)
    ctx = SimpleNamespace(application=SimpleNamespace(bot_data={"settings": SimpleNamespace(admin_user_id=1)}))
    await admin_document(update, ctx)
    assert "فقط" in msg.text
