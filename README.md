# Iraqi Sixth Bot | مساعد السادس العراقي

بوت Telegram عربي لخدمة طلبة السادس الإعدادي في العراق. الإصدار الأول لا يستخدم الذكاء الاصطناعي، ومصمم لإضافة خدمات ذكية لاحقًا عبر طبقة services دون تغيير قاعدة النظام.

## المزايا
يدير الفروع والمواد والملازم والأسئلة الوزارية والسنوات والأدوار، مع مفضلة وبحث أساسي ولوحة مدير محمية بمعرّف Telegram. الملفات تحفظ في Supabase Storage ولا تُرفع إلى GitHub.

## المتطلبات والتشغيل
يتطلب Python 3.12 وPostgreSQL عبر Supabase. أنشئ بيئة افتراضية ثم ثبّت الاعتماديات:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app
```

ضع القيم الحقيقية محليًا أو في Environment Variables في Railway لاحقًا. لا ترفع `.env`.

## المتغيرات
`TELEGRAM_BOT_TOKEN` و`SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` مطلوبة. `ADMIN_USER_ID` افتراضيًا هو `7112435274` ويمكن تغييره. يدعم `MAX_FILE_SIZE_MB` و`LOG_LEVEL`.

## Supabase
طبّق `migrations/001_initial.sql` من SQL Editor أو عبر Supabase CLI. أنشئ bucketين خاصين باسم `manhaj-files` و`ministerial-files`، ولا تجعل الملفات عامة. استخدم Service Role Key في الخادم فقط، وأصدر Signed URLs قصيرة عند الحاجة.

## الأمان
تُفحص صلاحية المدير على Telegram User ID في كل أمر وcallback إداري. لا يعتمد النظام على username. لا توجد أسرار أو ملفات PDF أو واجهات AI في المستودع.

## الاختبارات
```bash
pytest -q
```

## Railway لاحقًا
يمكن تشغيل المشروع باستخدام Dockerfile أو الأمر `python -m app`، مع إضافة المتغيرات يدويًا في Railway. لا يحتاج المشروع إلى أي ربط تلقائي بـ Railway.

## English summary
A maintainable Arabic Telegram bot for Iraqi sixth-grade students, built with Python, python-telegram-bot, Supabase PostgreSQL, and private Storage buckets. The first release intentionally contains no AI. Run `pytest -q` for tests and `python -m app` to start polling.
