import pytest
from pydantic import ValidationError
from app.config.settings import Settings

BASE = {"telegram_bot_token": "token", "supabase_service_role_key": "secret"}

def test_supabase_url_is_normalized():
    settings = Settings(**BASE, supabase_url=" https://kfrnvldtfwdkhewzuyti.supabase.co/ ")
    assert settings.supabase_url == "https://kfrnvldtfwdkhewzuyti.supabase.co"

@pytest.mark.parametrize("bad_url", [
    "SUPABASE_URL=https://kfrnvldtfwdkhewzuyti.supabase.co",
    "sb_secret_not_a_url",
    "https://supabase.com/dashboard/project/kfrnvldtfwdkhewzuyti",
    "db.kfrnvldtfwdkhewzuyti.supabase.co",
])
def test_invalid_supabase_url_is_rejected(bad_url):
    with pytest.raises(ValidationError, match="SUPABASE_URL"):
        Settings(**BASE, supabase_url=bad_url)
