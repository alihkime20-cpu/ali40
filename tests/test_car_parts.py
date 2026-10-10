import json
from types import SimpleNamespace

import pytest

from app.services import car_parts
from app.services.car_parts import (
    format_catalog_result,
    match_catalog_image,
)
from app.services.catalog import CatalogStore


def make_product(**overrides):
    product = {
        "id": "part-1",
        "full_name": "مضخة ماء تويوتا كورولا أصلية",
        "part_number": "16100-0T020",
        "details": "محرك 1.6 لتر، موديل 2018",
        "image_path": "part-1.jpg",
        "image_mime_type": "image/jpeg",
        "image_bytes": b"reference-image",
    }
    product.update(overrides)
    return product


def test_format_exact_catalog_match_returns_saved_full_name_and_number():
    text = format_catalog_result(
        {
            "status": "matched",
            "catalog_count": 1,
            "visible_text": "16100-0T020",
            "selected": {"product": make_product(), "confidence": "high", "reason": "تطابق الملصق والشكل"},
            "matches": [],
        }
    )
    assert "مضخة ماء تويوتا كورولا أصلية" in text
    assert "16100-0T020" in text
    assert "تطابق الملصق والشكل" in text


def test_empty_catalog_instructs_owner_to_add_reference():
    text = format_catalog_result(
        {"status": "empty_catalog", "catalog_count": 0, "visible_text": "", "matches": []}
    )
    assert "/addpart" in text


def test_uncertain_catalog_match_is_not_presented_as_exact():
    text = format_catalog_result(
        {
            "status": "possible",
            "catalog_count": 1,
            "visible_text": "AB-123",
            "selected": {"product": make_product(), "confidence": "medium", "reason": "تشابه عام"},
            "matches": [],
        }
    )
    assert "المطابقة غير مؤكدة" in text
    assert "مضخة ماء تويوتا كورولا أصلية" in text
    assert "AB-123" in text


@pytest.mark.asyncio
async def test_match_compares_query_to_catalog_reference_images(monkeypatch):
    captured = {}
    answer = {
        "match_index": 0,
        "same_product": True,
        "confidence": "high",
        "visible_text": "16100-0T020",
        "reason": "تطابق رقم القطعة الظاهر",
    }

    class FakeResponses:
        async def create(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(output_text=json.dumps(answer, ensure_ascii=False))

    class FakeClient:
        def __init__(self, **kwargs):
            captured["client_options"] = kwargs
            self.responses = FakeResponses()

        async def close(self):
            captured["closed"] = True

    class FakeStore:
        def list_products(self):
            return [make_product()]

        def load_images(self, products):
            return products

    monkeypatch.setattr(car_parts, "AsyncOpenAI", FakeClient)
    result = await match_catalog_image(
        b"query-image",
        query_mime_type="image/png",
        catalog_store=FakeStore(),
        api_key="test-key",
    )

    assert result["status"] == "matched"
    assert result["selected"]["product"]["full_name"] == "مضخة ماء تويوتا كورولا أصلية"
    content = captured["input"][0]["content"]
    image_inputs = [item for item in content if item["type"] == "input_image"]
    assert len(image_inputs) == 2
    assert image_inputs[0]["image_url"].startswith("data:image/png;base64,")
    assert "مضخة ماء تويوتا كورولا أصلية" in " ".join(
        item.get("text", "") for item in content
    )
    assert captured["closed"] is True


@pytest.mark.asyncio
async def test_empty_catalog_still_reads_visible_product_name(monkeypatch):
    label = {
        "product_name": "فلتر زيت تويوتا",
        "part_number": "90915-YZZE1",
        "visible_text": "TOYOTA 90915-YZZE1",
    }

    class FakeResponses:
        async def create(self, **kwargs):
            return SimpleNamespace(output_text=json.dumps(label, ensure_ascii=False))

    class FakeClient:
        def __init__(self, **kwargs):
            self.responses = FakeResponses()

        async def close(self):
            pass

    class FakeStore:
        def list_products(self):
            return []

    monkeypatch.setattr(car_parts, "AsyncOpenAI", FakeClient)
    result = await match_catalog_image(
        b"query-image",
        query_mime_type="image/jpeg",
        catalog_store=FakeStore(),
        api_key="test-key",
    )
    assert result["status"] == "empty_catalog"
    assert result["product_name"] == "فلتر زيت تويوتا"
    assert result["part_number"] == "90915-YZZE1"


def test_add_product_uploads_private_image_and_saves_metadata(monkeypatch):
    captured = {}

    class FakeStorage:
        def upload(self, path, payload, options):
            captured["path"] = path
            captured["payload"] = payload
            captured["options"] = options

        def remove(self, paths):
            captured["removed"] = paths

    class FakeTable:
        def insert(self, row):
            captured["row"] = row
            return self

        def execute(self):
            return SimpleNamespace(data=[{"id": "id-123", **captured["row"]}])

    class FakeClient:
        storage = SimpleNamespace(from_=lambda _bucket: FakeStorage())

        def table(self, _name):
            return FakeTable()

    monkeypatch.setattr("app.services.catalog.create_client", lambda *_args: FakeClient())
    store = CatalogStore("https://example.supabase.co", "test-key")
    saved = store.add_product(
        full_name="مضخة ماء أصلية",
        part_number="OEM-555",
        details="كورولا 2018",
        image_bytes=b"ref",
        mime_type="image/png",
    )
    assert saved["id"] == "id-123"
    assert captured["payload"] == b"ref"
    assert captured["options"]["content-type"] == "image/png"
    assert captured["row"]["full_name"] == "مضخة ماء أصلية"
    assert captured["row"]["part_number"] == "OEM-555"
