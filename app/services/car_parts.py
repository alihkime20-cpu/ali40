import asyncio
import base64
import json
from typing import Any

from openai import AsyncOpenAI


class CarPartAnalysisError(Exception):
    """Raised when a catalog image cannot be matched safely."""


MATCH_BATCH_SIZE = 6
MATCH_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "match_index": {"type": "integer"},
        "same_product": {"type": "boolean"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "visible_text": {"type": "string"},
        "reason": {"type": "string"},
    },
    "required": ["match_index", "same_product", "confidence", "visible_text", "reason"],
    "additionalProperties": False,
}
LABEL_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "product_name": {"type": "string"},
        "part_number": {"type": "string"},
        "visible_text": {"type": "string"},
    },
    "required": ["product_name", "part_number", "visible_text"],
    "additionalProperties": False,
}

MATCH_INSTRUCTIONS = """أنت أداة مطابقة بصرية بين صورة منتج يرسلها المستخدم وصور مرجعية في كتالوج خاص.
أجب باللغة العربية ضمن مخطط JSON فقط.
الصورة الأولى هي صورة الاستعلام، ثم تأتي صور الكتالوج بالترتيب المرقم في نص المستخدم.
أعد match_index صفريًا لأفضل صورة مرجعية مطابقة، أو -1 إذا لم يظهر تطابق موثوق.
اجعل same_product=true فقط إذا كان المنتج نفسه أو رقم القطعة/الملصق نفسه واضحًا؛ لا تعتبر مجرد التشابه العام في الفئة تطابقًا.
لا تخمّن اسمًا أو رقمًا غير ظاهر. اقرأ النص والأرقام الظاهرة في صورة الاستعلام إلى visible_text، وإلا اكتب: لا يوجد نص واضح.
إذا كانت الصورة غير واضحة أو المنتجات متشابهة جدًا، خفّض confidence أو أعد -1. اشرح سبب المطابقة باختصار في reason."""
LABEL_INSTRUCTIONS = """اقرأ النص المطبوع على صورة منتج/قطعة سيارة فقط.
لا تخمّن اسم منتج أو رقم قطعة غير ظاهر بوضوح. أعد product_name وpart_number فارغين إذا لم يكونا مقروءين، وضع النص المقروء كما هو في visible_text. أجب بالعربية ضمن مخطط JSON فقط."""


def _data_url(image_bytes: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _confidence_rank(value: str) -> int:
    return {"high": 3, "medium": 2, "low": 1}.get(value, 0)


async def _extract_product_label(
    image_bytes: bytes,
    *,
    mime_type: str,
    api_key: str,
    model: str,
) -> dict[str, str]:
    client = AsyncOpenAI(api_key=api_key, timeout=45.0, max_retries=1)
    try:
        response = await client.responses.create(
            model=model,
            instructions=LABEL_INSTRUCTIONS,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": "اقرأ اسم القطعة ورقمها إن كانا ظاهرين."},
                        {
                            "type": "input_image",
                            "image_url": _data_url(image_bytes, mime_type),
                            "detail": "high",
                        },
                    ],
                }
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "car_part_label_reading",
                    "strict": True,
                    "schema": LABEL_SCHEMA,
                }
            },
        )
    except Exception as exc:
        raise CarPartAnalysisError("تعذر قراءة النص الظاهر على الصورة.") from exc
    finally:
        await client.close()

    try:
        result = json.loads(getattr(response, "output_text", None) or "")
    except (TypeError, json.JSONDecodeError) as exc:
        raise CarPartAnalysisError("تعذر قراءة نتيجة OCR.") from exc
    if not isinstance(result, dict):
        raise CarPartAnalysisError("نتيجة قراءة النص غير صالحة.")
    return {
        key: str(result.get(key, "")).strip()
        for key in ("product_name", "part_number", "visible_text")
    }


async def match_catalog_image(
    query_image: bytes,
    *,
    query_mime_type: str,
    catalog_store,
    api_key: str,
    model: str = "gpt-4o-mini",
) -> dict[str, Any]:
    if not query_image:
        raise CarPartAnalysisError("الصورة فارغة.")
    if not api_key:
        raise CarPartAnalysisError("ميزة تحليل الصور غير مهيأة.")

    products = await asyncio.to_thread(catalog_store.list_products)
    if not products:
        label = await _extract_product_label(
            query_image, mime_type=query_mime_type, api_key=api_key, model=model
        )
        return {
            "status": "empty_catalog",
            "catalog_count": 0,
            **label,
            "matches": [],
        }

    client = AsyncOpenAI(api_key=api_key, timeout=60.0, max_retries=1)
    matches: list[dict[str, Any]] = []
    visible_text = ""
    try:
        for offset in range(0, len(products), MATCH_BATCH_SIZE):
            batch_meta = products[offset : offset + MATCH_BATCH_SIZE]
            candidates = await asyncio.to_thread(catalog_store.load_images, batch_meta)
            if not candidates:
                continue
            candidate_text = "مرشحو الكتالوج في هذه الدفعة:\n" + "\n".join(
                f"{index}: الاسم المسجل={item['full_name']}; "
                f"رقم القطعة={item.get('part_number') or 'غير مسجل'}; "
                f"التفاصيل={item.get('details') or 'غير مسجلة'}"
                for index, item in enumerate(candidates)
            )
            content: list[dict[str, str]] = [
                {"type": "input_text", "text": "طابق صورة المنتج الحالية مع المرشحين."},
                {
                    "type": "input_image",
                    "image_url": _data_url(query_image, query_mime_type),
                    "detail": "high",
                },
                {"type": "input_text", "text": candidate_text},
            ]
            for index, item in enumerate(candidates):
                content.append(
                    {"type": "input_text", "text": f"الصورة المرجعية رقم {index} للاسم المسجل أعلاه."}
                )
                content.append(
                    {
                        "type": "input_image",
                        "image_url": _data_url(item["image_bytes"], item["image_mime_type"]),
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
                            "name": "catalog_image_match",
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
                raise CarPartAnalysisError("تعذر قراءة نتيجة مطابقة الصور.") from exc
            if not isinstance(result, dict):
                continue
            if not visible_text and result.get("visible_text"):
                visible_text = str(result["visible_text"]).strip()
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
                    {
                        "product": candidates[index],
                        "confidence": confidence,
                        "reason": str(result.get("reason", "")).strip(),
                    }
                )
    finally:
        await client.close()

    matches.sort(key=lambda item: _confidence_rank(item["confidence"]), reverse=True)
    high_matches = [item for item in matches if item["confidence"] == "high"]
    if len(high_matches) == 1:
        status, selected = "matched", high_matches[0]
    elif len(high_matches) > 1:
        status, selected = "ambiguous", None
    elif len(matches) == 1:
        status, selected = "possible", matches[0]
    elif len(matches) > 1:
        status, selected = "ambiguous", None
    else:
        status, selected = "not_found", None

    return {
        "status": status,
        "catalog_count": len(products),
        "visible_text": visible_text,
        "selected": selected,
        "matches": matches[:3],
    }


def format_catalog_result(result: dict[str, Any]) -> str:
    status = result["status"]
    if status == "empty_catalog":
        lines = [
            "كتالوج المنتجات فارغ حاليًا. أضف صورة مرجعية واسم المنتج بالأمر /addpart."
        ]
        if result.get("product_name"):
            lines.append(f"الاسم المقروء من الصورة: {result['product_name']}")
        if result.get("part_number"):
            lines.append(f"رقم القطعة المقروء: {result['part_number']}")
        if result.get("visible_text"):
            lines.append(f"النص الظاهر: {result['visible_text'][:400]}")
        return "\n".join(lines)

    visible_text = (result.get("visible_text") or "").strip()
    if status == "matched":
        selected = result["selected"]
        product = selected["product"]
        lines = [f"الاسم المسجل في الكتالوج: {product['full_name']}"]
        if product.get("part_number"):
            lines.append(f"رقم القطعة: {product['part_number']}")
        if product.get("details"):
            lines.append(f"التفاصيل: {product['details']}")
        lines.append("درجة المطابقة البصرية: عالية")
        if selected.get("reason"):
            lines.append(f"سبب المطابقة: {selected['reason'][:400]}")
    elif status == "possible":
        product = result["selected"]["product"]
        lines = [
            "أقرب نتيجة محتملة في الكتالوج (المطابقة غير مؤكدة):",
            product["full_name"],
        ]
        if product.get("part_number"):
            lines.append(f"رقم القطعة: {product['part_number']}")
        if product.get("details"):
            lines.append(f"التفاصيل: {product['details']}")
    elif status == "ambiguous":
        lines = ["وجدت أكثر من منتج متشابه؛ لا أستطيع تأكيد اسم واحد:"]
        for item in result.get("matches", [])[:3]:
            product = item["product"]
            suffix = f" — {product['part_number']}" if product.get("part_number") else ""
            lines.append(f"• {product['full_name']}{suffix}")
        lines.append("صوّر الملصق أو رقم القطعة عن قرب لتمييزها.")
    else:
        lines = ["لم أجد تطابقًا موثوقًا لهذا المنتج في كتالوجك."]
        if result.get("catalog_count", 0) == 0:
            lines.append("أضف المنتجات المرجعية أولًا بالأمر /addpart.")

    if visible_text and visible_text.lower() not in {"لا يوجد نص واضح", "غير ظاهر بوضوح"}:
        lines.append(f"النص/الأرقام المقروءة من الصورة: {visible_text[:400]}")
    lines.append(
        "المطابقة تعتمد على الصور والأسماء التي أضفتها إلى الكتالوج، "
        "ولا تثبت وحدها توافق المنتج مع السيارة."
    )
    return "\n".join(lines)
