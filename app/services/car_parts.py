import asyncio
import base64
import json
from typing import Any

from openai import AsyncOpenAI


class CarPartAnalysisError(Exception):
    """Raised when a product image cannot be matched safely."""


MATCH_BATCH_SIZE = 6
MATCH_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "match_index": {"type": "integer"},
        "same_product": {"type": "boolean"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
    },
    "required": ["match_index", "same_product", "confidence"],
    "additionalProperties": False,
}

MATCH_INSTRUCTIONS = """أنت أداة تقارن صورة استعلام واحدة بصور مرجعية لمنتجات محددة.
أجب ضمن مخطط JSON فقط. الصورة الأولى هي صورة الاستعلام، ثم صور المنتجات بالترتيب المرقم في النص.
أعد match_index صفريًا لأفضل منتج مطابق، أو -1 إذا لم يظهر تطابق واضح.
اجعل same_product=true فقط عند وجود تطابق واضح للمنتج نفسه، لا لمجرد أنه من الفئة العامة نفسها.
استخدم شكل القطعة وأي ملصق أو رقم ظاهر؛ لا تختر منتجًا بسبب اسمه وحده.
إذا كانت الصورة غير واضحة أو لا يمكن تمييز المنتج عن منتجات مشابهة، أعد -1 أو confidence=low."""


def _unique_by_saved_name(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in items:
        product = item["product"]
        key = " ".join(product["full_name"].split()).casefold()
        if key and key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


def _aggregate_matches(matches: list[dict[str, Any]]) -> dict[str, Any]:
    high = _unique_by_saved_name(
        [item for item in matches if item["confidence"] == "high"]
    )
    if len(high) == 1:
        return {"status": "matched", "product": high[0]["product"]}
    if len(high) > 1:
        return {"status": "ambiguous", "products": [item["product"] for item in high[:3]]}
    unique_matches = _unique_by_saved_name(matches)
    if len(unique_matches) == 1:
        return {"status": "possible", "product": unique_matches[0]["product"]}
    if len(unique_matches) > 1:
        return {"status": "ambiguous", "products": [item["product"] for item in unique_matches[:3]]}
    return {"status": "not_found", "products": []}


def _data_url(image_bytes: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


async def match_product_image(
    query_image: bytes,
    *,
    query_mime_type: str,
    catalog_store,
    api_key: str,
    model: str = "gpt-4o-mini",
) -> dict[str, Any]:
    if not query_image:
        raise CarPartAnalysisError("الصورة فارغة.")
    products = await asyncio.to_thread(catalog_store.list_products)
    if not products:
        return {"status": "empty_catalog", "matches": []}

    client = AsyncOpenAI(api_key=api_key, timeout=60.0, max_retries=1)
    matches: list[dict[str, Any]] = []
    try:
        for offset in range(0, len(products), MATCH_BATCH_SIZE):
            candidates = await asyncio.to_thread(
                catalog_store.load_images,
                products[offset : offset + MATCH_BATCH_SIZE],
            )
            if not candidates:
                continue
            labels = "الصور المرجعية بالترتيب:\n" + "\n".join(
                f"{index}: الاسم المحفوظ هو «{product['full_name']}»"
                for index, product in enumerate(candidates)
            )
            content: list[dict[str, str]] = [
                {"type": "input_text", "text": "قارن صورة المنتج الحالية بالصور المرجعية."},
                {
                    "type": "input_image",
                    "image_url": _data_url(query_image, query_mime_type),
                    "detail": "high",
                },
                {"type": "input_text", "text": labels},
            ]
            for index, product in enumerate(candidates):
                content.append(
                    {"type": "input_text", "text": f"الصورة المرجعية رقم {index}."}
                )
                content.append(
                    {
                        "type": "input_image",
                        "image_url": _data_url(
                            product["image_bytes"], product["image_mime_type"]
                        ),
                        "detail": "low",
                    }
                )
            try:
                response = await client.responses.create(
                    model=model,
                    instructions=MATCH_INSTRUCTIONS,
                    input=[{"role": "user", "content": content}],
                    text={
                        "format": {
                            "type": "json_schema",
                            "name": "private_product_image_match",
                            "strict": True,
                            "schema": MATCH_SCHEMA,
                        }
                    },
                )
            except Exception as exc:
                raise CarPartAnalysisError("تعذر الوصول إلى خدمة مطابقة الصور.") from exc
            try:
                result = json.loads(getattr(response, "output_text", None) or "")
            except (TypeError, json.JSONDecodeError) as exc:
                raise CarPartAnalysisError("تعذر قراءة نتيجة المطابقة.") from exc
            if not isinstance(result, dict):
                continue
            index = result.get("match_index", -1)
            confidence = result.get("confidence", "low")
            if (
                result.get("same_product") is True
                and isinstance(index, int)
                and not isinstance(index, bool)
                and 0 <= index < len(candidates)
                and confidence in {"high", "medium"}
            ):
                matches.append(
                    {"product": candidates[index], "confidence": confidence}
                )
    finally:
        await client.close()

    return _aggregate_matches(matches)


def format_match(result: dict[str, Any]) -> str:
    status = result["status"]
    if status == "matched":
        return result["product"]["full_name"]
    if status == "possible":
        return f"الاسم الأقرب (غير مؤكد): {result['product']['full_name']}"
    if status == "ambiguous":
        names = "\n".join(f"• {product['full_name']}" for product in result["products"])
        return f"الصورة تشبه أكثر من منتج:\n{names}\nأرسل صورة أوضح للقطعة أو الملصق."
    if status == "empty_catalog":
        return "لم تُضف منتجات بعد. أرسل /addpart مرة لكل منتج: صورة مرجعية ثم الاسم الذي تريده."
    return "لم أجد تطابقًا واضحًا في صور المنتجات المسجلة. أرسل صورة أقرب أو أضف صورة المنتج بالأمر /addpart."
