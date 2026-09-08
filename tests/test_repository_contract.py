from app.database.repository import Repository

def test_repository_defines_required_contract_methods():
    for method in ("upsert_user", "list_branches", "list_subjects", "list_files", "get_file", "search", "add_file", "add_favorite", "list_favorites", "remove_favorite"):
        assert hasattr(Repository, method)
