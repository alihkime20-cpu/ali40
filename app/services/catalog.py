import logging
import uuid
from typing import Any

from supabase import Client, create_client

logger = logging.getLogger(__name__)
BUCKET_NAME = "car-part-catalog"
MAX_CATALOG_IMAGE_BYTES = 8 * 1024 * 1024
MIME_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


class CatalogError(Exception):
    """Raised when the private product catalog cannot be accessed."""


class CatalogStore:
    def __init__(self, url: str, service_role_key: str):
        self.client: Client = create_client(url, service_role_key)

    def add_product(self, *, full_name: str, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        full_name = full_name.strip()[:300]
        if not full_name:
            raise CatalogError("يجب إدخال اسم المنتج.")
        if len(image_bytes) > MAX_CATALOG_IMAGE_BYTES:
            raise CatalogError("حجم الصورة يتجاوز 8 ميغابايت.")
        extension = MIME_EXTENSIONS.get(mime_type)
        if not extension:
            raise CatalogError("صيغة الصورة غير مدعومة.")

        image_path = f"{uuid.uuid4()}.{extension}"
        storage = self.client.storage.from_(BUCKET_NAME)
        try:
            storage.upload(
                image_path,
                image_bytes,
                {"content-type": mime_type, "upsert": "false"},
            )
            response = (
                self.client.table("car_parts_catalog")
                .insert(
                    {
                        "full_name": full_name,
                        "image_path": image_path,
                        "image_mime_type": mime_type,
                    }
                )
                .execute()
            )
            if not response.data:
                raise CatalogError("لم يُحفظ المنتج.")
            return response.data[0]
        except Exception as exc:
            try:
                storage.remove([image_path])
            except Exception:
                logger.warning("Could not clean up an unlinked catalog image")
            if isinstance(exc, CatalogError):
                raise
            raise CatalogError("تعذر حفظ المنتج في Supabase.") from exc

    def list_products(self, page_size: int = 100) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        offset = 0
        try:
            while True:
                page = (
                    self.client.table("car_parts_catalog")
                    .select("id,full_name,image_path,image_mime_type,created_at")
                    .order("created_at")
                    .order("id")
                    .range(offset, offset + page_size - 1)
                    .execute()
                    .data
                    or []
                )
                rows.extend(page)
                if len(page) < page_size:
                    return rows
                offset += page_size
        except Exception as exc:
            raise CatalogError("تعذر قراءة أسماء المنتجات.") from exc

    def load_images(self, products: list[dict[str, Any]]) -> list[dict[str, Any]]:
        storage = self.client.storage.from_(BUCKET_NAME)
        loaded = []
        for product in products:
            try:
                image_bytes = storage.download(product["image_path"])
                if image_bytes:
                    item = dict(product)
                    item["image_bytes"] = bytes(image_bytes)
                    loaded.append(item)
            except Exception as exc:
                logger.warning("Could not load a catalog image (%s)", type(exc).__name__)
        return loaded
