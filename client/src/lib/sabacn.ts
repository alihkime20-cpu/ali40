export const articles = [
  { slug: "compress-images-without-losing-quality", title: "كيف تضغط الصور دون خسارة ملحوظة في الجودة؟", category: "الصور", excerpt: "دليل عملي لفهم الجودة والصيغة والأبعاد قبل رفع الصورة إلى موقعك.", readTime: "6 دقائق" },
  { slug: "jpg-png-webp-differences", title: "الفرق بين JPG وPNG وWebP ومتى تستخدم كل صيغة", category: "الصور", excerpt: "اختيار الصيغة المناسبة يوازن بين الجودة والشفافية وسرعة التحميل.", readTime: "8 دقائق" },
  { slug: "clean-text-before-publishing", title: "تنظيف النص قبل نشره: قائمة مراجعة قصيرة", category: "النصوص", excerpt: "خطوات عملية لإزالة الفراغات والتكرار والأخطاء التي تضعف القراءة.", readTime: "5 دقائق" },
  { slug: "seo-title-description-guide", title: "دليل عملي لكتابة عنوان ووصف صفحة واضحين", category: "SEO", excerpt: "كيف تكتب عنواناً مفيداً للقارئ ووصفاً يشرح الصفحة دون مبالغة.", readTime: "7 دقائق" },
  { slug: "json-validation-for-beginners", title: "فهم أخطاء JSON الشائعة وإصلاحها", category: "تقنية", excerpt: "أمثلة بسيطة تساعدك على اكتشاف الفواصل والاقتباسات غير الصحيحة.", readTime: "6 دقائق" },
  { slug: "privacy-first-browser-tools", title: "لماذا نعالج الملفات داخل المتصفح؟", category: "الخصوصية", excerpt: "شرح مبسط لفكرة المعالجة المحلية ومتى تكون أفضل من رفع الملف إلى خادم.", readTime: "5 دقائق" },
];

export type Article = (typeof articles)[number];

export function findArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

