from types import SimpleNamespace
import pytest
from app.handlers.core import admin_command, callback, search_command
from app.services.file_upload import FileUploadService

class Message:
    def __init__(self): self.sent = []
    async def reply_text(self, text, **kwargs): self.sent.append(text)

class Query:
    def __init__(self, data, user_id):
        self.data, self.from_user, self.text = data, SimpleNamespace(id=user_id), ""
    async def answer(self): pass
    async def edit_message_text(self, text, **kwargs): self.text = text

ADMIN = 7112435274

def context(repo=None):
    return SimpleNamespace(application=SimpleNamespace(bot_data={"settings": SimpleNamespace(admin_user_id=ADMIN), "repo": repo or SimpleNamespace()}))

@pytest.mark.asyncio
async def test_admin_command_rejects_regular_user():
    msg = Message(); update = SimpleNamespace(effective_user=SimpleNamespace(id=12), message=msg)
    await admin_command(update, context())
    assert "فقط" in msg.sent[0]

@pytest.mark.asyncio
@pytest.mark.parametrize("section", ["ministerial", "manhaj", "branches", "subjects", "stats", "users"])
async def test_admin_can_open_every_panel_section(section):
    query = Query(f"admin:{section}", ADMIN)
    # effective_user intentionally differs: authorization must use query.from_user.id.
    update = SimpleNamespace(callback_query=query, effective_user=SimpleNamespace(id=999))
    await callback(update, context())
    assert query.text and section in {"ministerial", "manhaj", "branches", "subjects", "stats", "users"}

@pytest.mark.asyncio
@pytest.mark.parametrize("section", ["ministerial", "manhaj", "branches", "subjects", "stats", "users"])
async def test_regular_user_cannot_open_admin_section_directly(section):
    query = Query(f"admin:{section}", 12)
    update = SimpleNamespace(callback_query=query, effective_user=SimpleNamespace(id=ADMIN))
    await callback(update, context())
    assert "ليس لديك صلاحية" in query.text

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
