from supabase import Client, create_client

class Repository:
    def __init__(self, url: str, key: str): self.client: Client = create_client(url, key)
    def upsert_user(self, telegram_user_id: int, username: str | None, first_name: str | None, last_name: str | None): return self.client.table("users").upsert({"telegram_user_id": telegram_user_id, "username": username, "first_name": first_name, "last_name": last_name}, on_conflict="telegram_user_id").execute().data[0]
    def list_branches(self): return self.client.table("branches").select("id,name").eq("is_active", True).order("name").execute().data
    def list_subjects(self, branch_id: str): return self.client.table("subjects").select("id,name").eq("branch_id", branch_id).eq("is_active", True).order("name").execute().data
    def list_all_subjects(self): return self.client.table("subjects").select("id,name,branch_id").eq("is_active", True).order("name").limit(100).execute().data
    def list_years(self): return self.client.table("academic_years").select("id,year").order("year", desc=True).execute().data
    def list_rounds(self): return self.client.table("rounds").select("id,name").order("id").execute().data
    def list_files(self, kind: str, branch_id: str, subject_id: str, year_id: str | None = None, round_id: str | None = None):
        query = self.client.table("files").select("id,title,description,file_path,telegram_file_id,file_size,year_id,round_id").eq("kind", kind).eq("branch_id", branch_id).eq("subject_id", subject_id).eq("is_active", True)
        if year_id: query = query.eq("year_id", year_id)
        if round_id: query = query.eq("round_id", round_id)
        return query.order("title").limit(50).execute().data
    def list_all_files(self, kind: str, limit: int = 50): return self.client.table("files").select("id,title,description,file_path,telegram_file_id,file_size").eq("kind", kind).eq("is_active", True).order("created_at", desc=True).limit(limit).execute().data
    def get_file(self, file_id: str):
        rows = self.client.table("files").select("id,title,kind,file_path,telegram_file_id").eq("id", file_id).eq("is_active", True).limit(1).execute().data
        return rows[0] if rows else None
    def search(self, term: str):
        safe = term.strip().replace("%", "")[:80]
        if not safe: return []
        return self.client.table("files").select("id,title,kind,file_path,telegram_file_id").ilike("title", f"%{safe}%").eq("is_active", True).limit(50).execute().data
    def add_file(self, values: dict): return self.client.table("files").insert(values).execute().data[0]
    def find_branch(self, name: str): return self.client.table("branches").select("id").eq("name", name).limit(1).execute().data
    def find_subject(self, branch_id: str, name: str): return self.client.table("subjects").select("id").eq("branch_id", branch_id).eq("name", name).limit(1).execute().data
    def find_subjects_all_branches(self, name: str): return self.client.table("subjects").select("id,name,branch_id").eq("name", name).eq("is_active", True).limit(10).execute().data
    def find_year(self, year: int): return self.client.table("academic_years").select("id").eq("year", year).limit(1).execute().data
    def find_round(self, name: str): return self.client.table("rounds").select("id").eq("name", name).limit(1).execute().data
    def upsert_news(self, rows: list[dict]) -> list[dict]:
        if not rows: return []
        urls = [r["source_url"] for r in rows]; existing = self.client.table("education_news").select("id,source_url").in_("source_url", urls).execute().data; known = {r["source_url"] for r in existing}; new_rows = [r for r in rows if r["source_url"] not in known]
        if not new_rows: return []
        return self.client.table("education_news").insert(new_rows).execute().data
    def list_news(self, limit: int = 10): return self.client.table("education_news").select("id,title,summary,source_url,published_at,source_name").eq("is_active", True).order("published_at", desc=True).limit(limit).execute().data
    def list_external_resources(self, category: str, branch_id: str | None = None, limit: int = 50):
        query = self.client.table("external_resources").select("title,description,url,source_name,year,round").eq("category", category).eq("is_active", True)
        if branch_id: query = query.eq("branch_id", branch_id)
        return query.order("year", desc=True).limit(limit).execute().data
    def statistics(self):
        def count(table: str, active_only: bool = False):
            query = self.client.table(table).select("id", count="exact", head=True)
            if active_only: query = query.eq("is_active", True)
            result = query.execute(); return result.count or 0
        return {"users": count("users"), "branches": count("branches", True), "subjects": count("subjects", True), "files": count("files", True), "manhaj": self.client.table("files").select("id", count="exact", head=True).eq("kind", "manhaj").eq("is_active", True).execute().count or 0, "ministerial": self.client.table("files").select("id", count="exact", head=True).eq("kind", "ministerial").eq("is_active", True).execute().count or 0, "news": count("education_news", True)}
    def notification_users(self): return self.client.table("users").select("id,telegram_user_id").eq("is_blocked", False).eq("news_notifications", True).limit(10000).execute().data
    def mark_news_delivered(self, news_id: str, user_id: str): return self.client.table("education_news_deliveries").upsert({"news_id": news_id, "user_id": user_id}, on_conflict="news_id,user_id").execute()
    def set_news_notifications(self, telegram_user_id: int, enabled: bool): return self.client.table("users").update({"news_notifications": enabled}).eq("telegram_user_id", telegram_user_id).execute()
    def add_favorite(self, telegram_user_id: int, file_id: str):
        user = self.client.table("users").select("id").eq("telegram_user_id", telegram_user_id).single().execute().data
        return self.client.table("favorites").upsert({"user_id": user["id"], "file_id": file_id}, on_conflict="user_id,file_id").execute().data
    def list_favorites(self, telegram_user_id: int):
        user = self.client.table("users").select("id").eq("telegram_user_id", telegram_user_id).single().execute().data
        return self.client.table("favorites").select("file_id,files(id,title,kind,telegram_file_id,file_path)").eq("user_id", user["id"]).limit(50).execute().data
    def remove_favorite(self, telegram_user_id: int, file_id: str):
        user = self.client.table("users").select("id").eq("telegram_user_id", telegram_user_id).single().execute().data
        return self.client.table("favorites").delete().eq("user_id", user["id"]).eq("file_id", file_id).execute().data
