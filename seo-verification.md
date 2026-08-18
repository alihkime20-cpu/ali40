# SEO Route Verification

تم التحقق محلياً في 2026-08-18 من مساري SEO:

- `/robots.txt` يعيد نصاً صالحاً يتضمن `User-agent: *` و`Allow: /` وحظر `/api/` و`/__manus__/` ورابط Sitemap مطلقاً من المضيف الحالي.
- `/sitemap.xml` يعيد XML بصيغة `urlset`، ويضم الصفحة الرئيسية والصفحات العامة `/about` و`/contact` و`/privacy` و`/terms` و`/content-policy`، إضافة إلى روابط المقالات المنشورة من قاعدة البيانات.
- روابط المقالات تستخدم النطاق الحالي، وحقول `lastmod` بصيغة ISO، و`changefreq=daily` و`priority=0.7`.
- عند تعذر قاعدة البيانات، يبقى sitemap صالحاً ويضم الصفحات العامة بدلاً من فشل الاستجابة.
