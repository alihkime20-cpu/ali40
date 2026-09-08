from types import SimpleNamespace
import pytest
from app.handlers.core import admin_command, callback, search_command
from app.services.file_upload import FileUploadService

class Message:
    def __init__(self): self.sent = []
    async def reply_text(self, text, **kwargs): self.sent.append(text)

@pytest.mark.asyncio
async def test_admin_command_rejects_regular_user():
    msg = Message(); update = SimpleNamespace(effective_user=SimpleNamespace(id=12), message=msg)
    ctx = SimpleNamespace(application=SimpleNamespace(bot_data={"settings": SimpleNamespace(admin_user_id=7112435274)}))
    await admin_command(update, ctx)
    assert "فقط" in msg.sent[0]

@pytest.mark.asyncio
async def test_admin_callback_rejects_regular_user():
    class Query:
        data = "admin:stats"
        async def answer(self): pass
        async def edit_message_text(self, text, **kwargs): self.text = text
    q = Query(); update = SimpleNamespace(callback_query=q, effective_user=SimpleNamespace(id=22))
    ctx = SimpleNamespace(application=SimpleNamespace(bot_data={"settings": SimpleNamespace(admin_user_id=7112435274), "repo": SimpleNamespace()}))
    await callback(update, ctx)
    assert "صلاحية" in q.text

@pytest.mark.asyncio
async def test_search_empty_is_safe():
    msg = Message(); update = SimpleNamespace(message=msg, effective_user=SimpleNamespace(id=1))
    repo = SimpleNamespace(search=lambda term: [])
    ctx = SimpleNamespace(args=[], application=SimpleNamespace(bot_data={"repo": repo}))
    await search_command(update, ctx)
    assert "استخدم" in msg.sent[0]

def test_upload_rolls_back_storage_when_database_fails():
    class Storage:
        def __init__(self): self.uploaded = []; self.removed = []
        def upload(self, bucket, path, content): self.uploaded.append((bucket, path))
        def remove(self, bucket, path): self.removed.append((bucket, path))
    class Repo:
        def add_file(self, values): raise RuntimeError("db down")
    storage = Storage()
    with pytest.raises(RuntimeError): FileUploadService(storage, Repo(), 100).save_pdf(content=b"x", filename="ملزمة.pdf", bucket="manhaj-files", metadata={"kind":"manhaj","title":"x","branch_id":"b","subject_id":"s"})
    assert len(storage.uploaded) == len(storage.removed) == 1

def test_upload_rejects_non_pdf_and_oversized():
    svc = FileUploadService(SimpleNamespace(), SimpleNamespace(), 2)
    with pytest.raises(ValueError): svc.save_pdf(content=b"x", filename="x.txt", bucket="b", metadata={})
    with pytest.raises(ValueError): svc.save_pdf(content=b"xxx", filename="x.pdf", bucket="b", metadata={})
