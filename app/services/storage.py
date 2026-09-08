from supabase import Client

MANHAJ_BUCKET = "manhaj-files"
MINISTERIAL_BUCKET = "ministerial-files"

class StorageService:
    def __init__(self, client: Client): self.client = client
    def upload(self, bucket: str, path: str, content: bytes, content_type: str = "application/pdf"):
        return self.client.storage.from_(bucket).upload(path, content, {"content-type": content_type, "upsert": "false"})
    def signed_url(self, bucket: str, path: str, expires: int = 300) -> str:
        return self.client.storage.from_(bucket).create_signed_url(path, expires)["signedURL"]
