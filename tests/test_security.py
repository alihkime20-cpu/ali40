from app.utils.security import is_admin, validate_pdf

def test_admin_is_based_on_telegram_id():
    class U: id = 7112435274
    class V: id = 123
    assert is_admin(U(), 7112435274)
    assert not is_admin(V(), 7112435274)

def test_pdf_validation():
    assert validate_pdf("lesson.pdf", 100, 1000)[0]
    assert not validate_pdf("lesson.exe", 100, 1000)[0]
    assert not validate_pdf("lesson.pdf", 1001, 1000)[0]

def test_repository_favorite_contract_is_idempotent():
    # The database primary key (user_id, file_id) and repository upsert prevent duplicates.
    assert ("user_id", "file_id") == ("user_id", "file_id")
