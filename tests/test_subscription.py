import pytest
from types import SimpleNamespace
from app.handlers.subscription import is_subscribed

@pytest.mark.asyncio
async def test_admin_is_exempt():
    ctx = SimpleNamespace(application=SimpleNamespace(bot_data={"settings": SimpleNamespace(admin_user_id=7, required_channel="@a11g9n")}))
    assert await is_subscribed(7, ctx)

@pytest.mark.asyncio
async def test_member_is_accepted():
    class Bot:
        async def get_chat_member(self, channel, user): return SimpleNamespace(status="member")
    ctx = SimpleNamespace(application=SimpleNamespace(bot_data={"settings": SimpleNamespace(admin_user_id=7, required_channel="@a11g9n")}), bot=Bot())
    assert await is_subscribed(8, ctx)
