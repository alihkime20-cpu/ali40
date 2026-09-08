from supabase import Client, create_client

class Repository:
    def __init__(self, url: str, key: str):
        self.client: Client = create_client(url, key)

    def upsert_user(self, telegram_user_id: int, username: str | None, first_name: str | None, last_name: str | None):
        return self.client.table("users").upsert({"telegram_user_id": telegram_user_id, "username": username, "first_name": first_name, "last_name": last_name}, on_conflict="telegram_user_id").execute().data[0]

    def list_branches(self):
        return self.client.table("branches").select("id,name").eq("is_active", True).order("name").execute().data

    def list_subjects(self, branch_id: str):
        return self.client.table("subjects").select("id,name").eq("branch_id", branch_id).eq("is_active", True).order("name").execute().data

    def list_files(self, kind: str, branch_id: str, subject_id: str):
        return self.client.table("files").select("id,title,description,file_path,telegram_file_id,file_size").eq("kind", kind).eq("branch_id", branch_id).eq("subject_id", subject_id).eq("is_active", True).order("title").limit(50).execute().data

    def search(self, term: str):
        safe = term.strip().replace("%", "")[:80]
        return self.client.table("files").select("id,title,kind,file_path,telegram_file_id").ilike("title", f"%{safe}%").eq("is_active", True).limit(20).execute().data

    def add_favorite(self, telegram_user_id: int, file_id: str):
        user = self.client.table("users").select("id").eq("telegram_user_id", telegram_user_id).single().execute().data
        return self.client.table("favorites").upsert({"user_id": user["id"], "file_id": file_id}, on_conflict="user_id,file_id").execute().data

    def list_favorites(self, telegram_user_id: int):
        user = self.client.table("users").select("id").eq("telegram_user_id", telegram_user_id).single().execute().data
        return self.client.table("favorites").select("file_id,files(id,title,kind,telegram_file_id,file_path)").eq("user_id", user["id"]).limit(50).execute().data

    def remove_favorite(self, telegram_user_id: int, file_id: str):
        user = self.client.table("users").select("id").eq("telegram_user_id", telegram_user_id).single().execute().data
        return self.client.table("favorites").delete().eq("user_id", user["id"]).eq("file_id", file_id).execute().data
