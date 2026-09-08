import logging
from telegram import User

logger = logging.getLogger(__name__)


def is_admin(user: User | None, admin_user_id: int) -> bool:
    return bool(user and user.id == admin_user_id)


def validate_pdf(filename: str | None, file_size: int | None, max_bytes: int) -> tuple[bool, str]:
    if not filename or not filename.lower().endswith(".pdf"):
        return False, "يسمح برفع ملفات PDF فقط."
    if file_size is not None and file_size > max_bytes:
        return False, f"حجم الملف يتجاوز الحد المسموح ({max_bytes // 1024 // 1024} MB)."
    return True, ""
