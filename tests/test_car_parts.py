import json
from types import SimpleNamespace

import pytest

from app.services import car_parts
from app.services.car_parts import _aggregate_matches, format_match, match_product_image
from app.services.catalog import CatalogError, CatalogStore


def sample_product(**overrides):
    product = {
        "id": "part-1",
        "full_name": "مضخة ماء تويوتا كورولا الأصلية",
        "image_path": "part-1.jpg",
        "image_mime_type": "image/jpeg",
        "image_bytes": b"reference-image",
    }
    product.update(overrides)
    return product


def test_exact_match_replies_with_only_saved_name():
    text = format_match({"status": "matched", "product": sample_product()})
    assert text == "مضخة ماء تويوتا كورولا الأصلية"


def test_uncertain_match_is_labeled_not_asserted():
    text = format_match({"status": "possible", "product": sample_product()})
    assert text == "الاسم الأقرب (غير مؤكد): مضخة ماء تويوتا كورولا الأصلية"


def test_ambiguous_match_lists_names_only():
    text = format_match(
        {
            "status": "ambiguous",
            "products": [sample_product(), sample_product(full_name="مضخة ماء بديلة")],
        }
    )
    assert "مضخة ماء تويوتا كورولا الأصلية" in text
    assert "مضخة ماء بديلة" in text
    assert "رقم القطعة" not in text


def test_multiple_reference_angles_with_same_name_are_one_product():
    product = sample_product()
    result = _aggregate_matches(
        [
            {"product": product, "confidence": "high"},
            {
                "product": sample_product(id="part-angle-2", image_path="angle-2.jpg"),
                "confidence": "high",
            },
        ]
    )
    assert result["status"] == "matched"
    assert format_match(result) == "مضخة ماء تويوتا كورولا الأصلية"


def test_distinct_high_confidence_names_remain_ambiguous():
    result = _aggregate_matches(
        [
            {"product": sample_product(), "confidence": "high"},
            {
                "product": sample_product(full_name="مضخة ماء بديلة"),
                "confidence": "high",
            },
        ]
    )
    assert result["status"] == "ambiguous"
    assert len(result["products"]) == 2


@pytest.mark.asyncio
async def test_match_compares_query_photo_with_saved_reference(monkeypatch):
    captured = {}
    answer = {"match_index": 0, "same_product": True, "confidence": "high"}

    class FakeResponses:
        async def create(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(output_text=json.dumps(answer))

    class FakeClient:
        def __init__(self, **kwargs):
            captured["client_options"] = kwargs
            self.responses = FakeResponses()

        async def close(self):
            captured["closed"] = True

    class FakeStore:
        def list_products(self):
            return [sample_product()]

        def load_images(self, products):
            return products

    monkeypatch.setattr(car_parts, "AsyncOpenAI", FakeClient)
    result = await match_product_image(
        b"query-image",
        query_mime_type="image/png",
        catalog_store=FakeStore(),
        api_key="test-key",
    )
    assert result["status"] == "matched"
    assert format_match(result) == "مضخة ماء تويوتا كورولا الأصلية"
    content = captured["input"][0]["content"]
    images = [item for item in content if item["type"] == "input_image"]
    assert len(images) == 2
    assert images[0]["image_url"].startswith("data:image/png;base64,")
    assert "الاسم المحفوظ هو «مضخة ماء تويوتا كورولا الأصلية»" in " ".join(
        item.get("text", "") for item in content
    )
    assert captured["closed"] is True


@pytest.mark.asyncio
async def test_empty_catalog_requests_initial_photo_name_pair():
    class FakeStore:
        def list_products(self):
            return []

    result = await match_product_image(
        b"query-image",
        query_mime_type="image/jpeg",
        catalog_store=FakeStore(),
        api_key="test-key",
    )
    assert format_match(result).startswith("لم تُضف منتجات بعد")


def test_catalog_store_saves_image_and_name_only(monkeypatch):
    captured = {}

    class FakeStorage:
        def upload(self, path, payload, options):
            captured.update(path=path, payload=payload, options=options)

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
        full_name="فلتر هواء أصلي",
        image_bytes=b"reference-image",
        mime_type="image/png",
    )
    assert saved["id"] == "id-123"
    assert captured["row"] == {
        "full_name": "فلتر هواء أصلي",
        "image_path": captured["path"],
        "image_mime_type": "image/png",
    }


def test_catalog_store_rejects_empty_name():
    store = CatalogStore.__new__(CatalogStore)
    with pytest.raises(CatalogError):
        # CatalogStore validates the name before making a storage call.
        store.add_product(full_name="", image_bytes=b"image", mime_type="image/jpeg")
