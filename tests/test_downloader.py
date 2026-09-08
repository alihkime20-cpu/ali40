import pytest
from app.services.downloader import DownloadError, extract_url, validate_url

def test_extracts_social_url():
    assert extract_url("حمّل https://www.tiktok.com/@user/video/123 الآن") == "https://www.tiktok.com/@user/video/123"

def test_rejects_unsupported_host():
    with pytest.raises(DownloadError): validate_url("https://example.com/video")

def test_accepts_instagram():
    validate_url("https://www.instagram.com/reel/ABC123/")

def test_accepts_short_tiktok_link():
    validate_url("https://vm.tiktok.com/ZM123/")

def test_accepts_instagram_subdomain():
    validate_url("https://m.instagram.com/reel/ABC123/")

def test_extract_url_without_link():
    assert extract_url("لا يوجد رابط") is None
