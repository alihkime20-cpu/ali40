from uuid import uuid4
from app.utils.security import validate_pdf

class FileUploadService:
    def __init__(self, storage, repository, max_bytes: int):
        self.storage, self.repository, self.max_bytes = storage, repository, max_bytes

    def save_pdf(self, *, content: bytes, filename: str, bucket: str, metadata: dict):
        ok, error = validate_pdf(filename, len(content), self.max_bytes)
        if not ok:
            raise ValueError(error)
        path = f"{uuid4().hex}/{filename.replace('/', '_')}"
        self.storage.upload(bucket, path, content)
        try:
            return self.repository.add_file({**metadata, "file_path": path, "file_type": "application/pdf", "file_size": len(content)})
        except Exception:
            try:
                self.storage.remove(bucket, path)
            finally:
                raise
