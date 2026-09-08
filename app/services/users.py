from supabase import Client, create_client

class UserStore:
    def __init__(self, url: str, key: str): self.client: Client = create_client(url, key)
    def upsert(self, user) -> None:
        self.client.table("bot_users").upsert({"telegram_user_id": user.id, "username": user.username, "first_name": user.first_name, "last_name": user.last_name, "is_active": True}, on_conflict="telegram_user_id").execute()
    def ids(self) -> list[int]:
        rows = self.client.table("bot_users").select("telegram_user_id").eq("is_active", True).limit(10000).execute().data
        return [int(row["telegram_user_id"]) for row in rows]
    def deactivate(self, user_id: int) -> None: self.client.table("bot_users").update({"is_active": False}).eq("telegram_user_id", user_id).execute()
