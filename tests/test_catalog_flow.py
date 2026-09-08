from types import SimpleNamespace
import pytest
from app.handlers.core import callback

class Query:
    def __init__(self, data): self.data, self.from_user, self.text = data, SimpleNamespace(id=7112435274), ""
    async def answer(self): pass
    async def edit_message_text(self, text, **kwargs): self.text, self.reply_markup = text, kwargs.get("reply_markup")

class Repo:
    def list_branches(self): return [{"id":"b1","name":"السادس العلمي"}]
    def list_subjects(self, _): return [{"id":"s1","name":"الرياضيات"}]
    def list_years(self): return [{"id":"y1","year":2025}]
    def list_rounds(self): return [{"id":"r1","name":"الدور الأول"}]
    def list_files(self, *args): return [{"id":"f1","title":"اختبار الرياضيات"}]
    def get_file(self, _): return {"id":"f1","title":"x","telegram_file_id":None}

@pytest.mark.asyncio
@pytest.mark.parametrize("data, expected", [
    ("branches:manhaj", "اختر الفرع:"), ("branch:manhaj:b1", "اختر المادة:"),
    ("subject:manhaj:b1:s1", "اختر السنة:"), ("year:manhaj:b1:s1:y1", "اختر الدور:"),
    ("round:manhaj:b1:s1:y1:r1", "اختر الملف:")])
async def test_student_catalog_flow(data, expected):
    q = Query(data); ctx = SimpleNamespace(application=SimpleNamespace(bot_data={"repo":Repo(), "settings":SimpleNamespace(admin_user_id=7112435274)}))
    await callback(SimpleNamespace(callback_query=q), ctx)
    assert q.text == expected
