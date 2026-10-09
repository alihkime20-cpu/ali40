import base64
import json
from typing import Any

from openai import AsyncOpenAI


class CarPartAnalysisError(Exception):
    """Raised when a part image cannot be analyzed safely."""


ANALYSIS_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "status": {"type": "string", "enum": ["identified", "possible", "unclear"]},
        "part_name": {"type": "string"},
        "category": {"type": "string"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "visual_description": {"type": "string"},
        "visible_identifiers": {"type": "string"},
        "follow_up": {"type": "string"},
    },
    "required": [
        "status",
        "part_name",
        "category",
        "confidence",
        "visual_description",
        "visible_identifiers",
        "follow_up",
    ],
    "additionalProperties": False,
}

INSTRUCTIONS = """أنت مساعد بصري أولي للتعرّف على قطع غيار السيارات من الصور.
أجب باللغة العربية وبالحقول المطلوبة فقط. اعتمد على ما يظهر في الصورة ولا تخمّن رقم قطعة أو الشركة أو التوافق مع سيارة.
إذا كانت الصورة لا تكفي لتحديد القطعة، اجعل status=unclear وconfidence=low، واطلب صورة أوضح أو صورة للملصق/رقم القطعة.
ميّز بين جزء ظاهر بوضوح وبين احتمال. لا تدّعِ أن القطعة أصلية أو صالحة أو متوافقة مع سيارة.
في visible_identifiers اكتب فقط الأرقام أو العلامات المقروءة بوضوح، وإلا اكتب: غير ظاهر بوضوح.
في follow_up اطلب عند الحاجة نوع السيارة والموديل وسنة الصنع والمحرك أو رقم الهيكل ورقم القطعة للتحقق من التوافق."""

SUPPORTED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


async def analyze_car_part(
    image_bytes: bytes,
    *,
    api_key: str,
    model: str = "gpt-4o-mini",
    caption: str = "",
    mime_type: str = "image/jpeg",
) -> dict[str, str]:
    if not image_bytes:
        raise CarPartAnalysisError("الصورة فارغة.")
    if not api_key:
        raise CarPartAnalysisError("ميزة تحليل الصور غير مهيأة.")
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise CarPartAnalysisError("صيغة الصورة غير مدعومة.")

    encoded_image = base64.b64encode(image_bytes).decode("ascii")
    user_text = "حلّل قطعة السيارة الظاهرة في الصورة."
    if caption.strip():
        user_text += f"\nمعلومات أضافها المستخدم عن السيارة أو القطعة: {caption.strip()[:500]}"

    client = AsyncOpenAI(api_key=api_key, timeout=45.0, max_retries=1)
    try:
        response = await client.responses.create(
            model=model,
            instructions=INSTRUCTIONS,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": user_text},
                        {
                            "type": "input_image",
                            "image_url": f"data:{mime_type};base64,{encoded_image}",
                            "detail": "high",
                        },
                    ],
                }
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "car_part_identification",
                    "strict": True,
                    "schema": ANALYSIS_SCHEMA,
                }
            },
        )
    except Exception as exc:
        raise CarPartAnalysisError("تعذر الوصول إلى خدمة تحليل الصور.") from exc
    finally:
        await client.close()

    output_text = getattr(response, "output_text", None)
    if not output_text:
        raise CarPartAnalysisError("لم تُرجع خدمة التحليل نتيجة قابلة للقراءة.")
    try:
        result = json.loads(output_text)
    except (TypeError, json.JSONDecodeError) as exc:
        raise CarPartAnalysisError("تعذر قراءة نتيجة تحليل الصورة.") from exc

    required = set(ANALYSIS_SCHEMA["required"])
    if not isinstance(result, dict) or not required.issubset(result):
        raise CarPartAnalysisError("نتيجة تحليل الصورة غير مكتملة.")
    if result["status"] not in {"identified", "possible", "unclear"}:
        raise CarPartAnalysisError("حالة التعرّف غير صالحة.")
    if result["confidence"] not in {"high", "medium", "low"}:
        raise CarPartAnalysisError("درجة الوضوح غير صالحة.")
    return {key: str(result[key]).strip() for key in required}


def format_analysis(result: dict[str, str]) -> str:
    confidence_ar = {"high": "واضح نسبيًا", "medium": "متوسط", "low": "منخفض"}
    status = result.get("status", "unclear")
    name = result.get("part_name", "").strip()
    if status == "unclear" or not name:
        lines = ["لم أتمكن من تحديد القطعة بثقة من هذه الصورة."]
    else:
        label = "القطعة المحتملة" if status == "possible" else "التعرّف المبدئي"
        lines = [f"🔎 {label}: {name}"]
        category = result.get("category", "").strip()
        if category:
            lines.append(f"التصنيف: {category}")
        lines.append(
            "وضوح الصورة للتعرّف: "
            f"{confidence_ar.get(result.get('confidence', 'low'), 'غير محدد')}"
        )

    description = result.get("visual_description", "").strip()
    identifiers = result.get("visible_identifiers", "").strip()
    follow_up = result.get("follow_up", "").strip()
    if description:
        lines.append(f"ملاحظات بصرية: {description[:600]}")
    if identifiers and identifiers.lower() not in {
        "غير ظاهر بوضوح",
        "غير ظاهر",
        "لا يوجد",
    }:
        lines.append(f"العلامات/الأرقام المقروءة: {identifiers[:250]}")
    if follow_up:
        lines.append(f"للمتابعة: {follow_up[:400]}")
    lines.append(
        "\nهذا تحليل بصري مبدئي فقط؛ لا يؤكد رقم القطعة أو توافقها أو سلامتها. "
        "تحقق من رقم OEM/الكتالوج وموديل السيارة وسنة الصنع قبل الشراء أو التركيب."
    )
    return "\n".join(lines)
