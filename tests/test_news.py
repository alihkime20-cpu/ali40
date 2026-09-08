from app.services.news import parse_official_news

def test_parse_official_news_extracts_text_and_source_link():
    page = '<div class="tgme_widget_message_text">خبر تعليمي رسمي مهم للطلبة<br>تفاصيل الخبر</div><a href="https://t.me/Educationiq/123">x</a>'
    rows = parse_official_news(page)
    assert rows and rows[0]["title"].startswith("خبر تعليمي")
    assert rows[0]["source_name"] == "وزارة التربية العراقية"

def test_parse_ignores_empty_posts():
    assert parse_official_news('<div class="tgme_widget_message_text">x</div>') == []
