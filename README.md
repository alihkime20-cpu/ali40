# بوت تنزيل فيديوهات TikTok وInstagram

بوت Telegram يستقبل رابطًا عامًا من TikTok أو Instagram، ينزّل الفيديو مؤقتًا، يرسله للمستخدم، ثم يحذف الملف من الخادم. لا يستخدم قاعدة بيانات ولا يحفظ الروابط أو الفيديوهات بعد الإرسال.

## متغيرات التشغيل

```env
TELEGRAM_BOT_TOKEN=
MAX_FILE_SIZE_MB=49
DOWNLOAD_TIMEOUT_SECONDS=180
LOG_LEVEL=INFO
```

## الاستخدام

أرسل إلى البوت رابطًا عامًا مثل:

```text
https://www.tiktok.com/@user/video/...
https://www.instagram.com/reel/...
```

يدعم البوت المحتوى العام فقط، وقد تفشل الروابط الخاصة أو المحمية بتسجيل الدخول. يجب استخدامه بما يتوافق مع شروط TikTok وInstagram وحقوق أصحاب المحتوى.

## التشغيل

```bash
pip install -r requirements.txt
python -m app
```

لا توجد Supabase أو PostgreSQL أو ملفات محتوى في هذا الإصدار.
