import json
from types import SimpleNamespace

import pytest

from app.services import car_parts
from app.services.car_parts import (
    CarPartAnalysisError,
    analyze_car_part,
    format_analysis,
)


def sample_result(**overrides):
    result = {
        "status": "possible",
        "part_name": "مضخة ماء",
        "category": "نظام التبريد",
        "confidence": "medium",
        "visual_description": "قطعة معدنية ذات بكرة وموصلات ماء.",
        "visible_identifiers": "غير ظاهر بوضوح",
        "follow_up": "أرسل موديل السيارة وسنة الصنع ورقم القطعة.",
    }
    result.update(overrides)
    return result


def test_format_analysis_includes_safe_fitment_warning():
    text = format_analysis(sample_result())
    assert "القطعة المحتملة: مضخة ماء" in text
    assert "لا يؤكد رقم القطعة أو توافقها أو سلامتها" in text


def test_unclear_image_does_not_claim_identification():
    text = format_analysis(
        sample_result(status="unclear", part_name="", confidence="low")
    )
    assert "لم أتمكن من تحديد القطعة بثقة" in text
    assert "التعرّف المبدئي:" not in text


@pytest.mark.asyncio
async def test_analyze_sends_image_and_caption_as_structured_request(monkeypatch):
    payload = sample_result(status="identified", confidence="high")
    seen = {}

    class FakeResponses:
        async def create(self, **kwargs):
            seen.update(kwargs)
            return SimpleNamespace(output_text=json.dumps(payload, ensure_ascii=False))

    class FakeClient:
        def __init__(self, **kwargs):
            seen["client_options"] = kwargs
            self.responses = FakeResponses()
            self.closed = False

        async def close(self):
            self.closed = True

    monkeypatch.setattr(car_parts, "AsyncOpenAI", FakeClient)
    result = await analyze_car_part(
        b"image-bytes",
        api_key="test-key",
        model="gpt-4o-mini",
        caption="Toyota Corolla 2018",
        mime_type="image/png",
    )

    assert result["part_name"] == "مضخة ماء"
    assert seen["model"] == "gpt-4o-mini"
    image_part = seen["input"][0]["content"][1]
    assert image_part["image_url"].startswith("data:image/png;base64,")
    assert "Toyota Corolla 2018" in seen["input"][0]["content"][0]["text"]
    assert seen["text"]["format"]["type"] == "json_schema"


@pytest.mark.asyncio
async def test_analyze_rejects_empty_or_unsupported_image():
    with pytest.raises(CarPartAnalysisError):
        await analyze_car_part(b"", api_key="test-key")
    with pytest.raises(CarPartAnalysisError):
        await analyze_car_part(b"image", api_key="test-key", mime_type="image/bmp")
