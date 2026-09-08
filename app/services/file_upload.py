import logging
from uuid import uuid4

logger = logging.getLogger(__name__)

class FileUploadService:
    def __init__(self, storage, repository, max_bytes: int):
        self.storage, self.repository, self.max_bytes = storage, repository, max_bytes

    def save_file(self, *, content: bytes, filename: str, bucket: str, metadata: dict, content_type: str | None = None):
        if not filename: raise ValueError("اسم الملف مفقود.")
        if len(content) > self.max_bytes: raise ValueError(f"حجم الملف يتجاوز الحد المسموح ({self.max_bytes // 1024 // 1024} MB).")
        safe_name = filename.replace("/", "_").replace("\\", "_")
        path = f"{uuid4().hex}/{safe_name}"
        detected_type = content_type or "application/octet-stream"
        uploaded = False
        try:
            try: self.storage.upload(bucket, path, content, detected_type)
            except TypeError: self.storage.upload(bucket, path, content)
            uploaded = True
        except Exception:
            logger.exception("Supabase Storage upload failed; using Telegram file_id fallback")
            if not metadata.get("telegram_file_id"):
                raise
            path = f"telegram/{metadata['telegram_file_id']}"
        try:
            return self.repository.add_file({**metadata, "file_path": path, "file_type": detected_type, "file_size": len(content)})
        except Exception:
            if uploaded:
                try: self.storage.remove(bucket, path)
                except Exception: logger.exception("Could not roll back Storage file")
            raise

    def save_pdf(self, *, content: bytes, filename: str, bucket: str, metadata: dict):
        if not filename.lower().endswith(".pdf"): raise ValueError("يسمح برفع ملفات PDF فقط.")
        return self.save_file(content=content, filename=filename, bucket=bucket, metadata=metadata, content_type="application/pdf")
