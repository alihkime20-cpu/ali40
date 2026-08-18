import type { LucideIcon } from "lucide-react";
import { Braces, FileImage, FileText, ImageDown, KeyRound, Link2, Palette, ScanLine, SearchCheck, ShieldCheck, Sparkles, Type, Wrench } from "lucide-react";

export type ToolCategory = "الكل" | "الصور" | "PDF" | "النصوص" | "SEO" | "تقنية";
export type ToolKind = "text" | "image" | "utility";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: Exclude<ToolCategory, "الكل">;
  icon: LucideIcon;
  kind: ToolKind;
  popular?: boolean;
  tags: string[];
};

export const categories: { name: ToolCategory; icon: LucideIcon }[] = [
  { name: "الكل", icon: Sparkles },
  { name: "الصور", icon: FileImage },
  { name: "PDF", icon: FileText },
  { name: "النصوص", icon: Type },
  { name: "SEO", icon: SearchCheck },
  { name: "تقنية", icon: Wrench },
];

export const tools: Tool[] = [
  { slug: "image-compressor", name: "ضغط الصور", description: "قلّل حجم الصور محلياً في متصفحك مع التحكم بالجودة.", category: "الصور", icon: ImageDown, kind: "image", popular: true, tags: ["تصغير", "حجم", "webp"] },
  { slug: "image-resizer", name: "تغيير حجم الصور", description: "غيّر أبعاد الصورة بدقة مع الحفاظ على تناسبها.", category: "الصور", icon: FileImage, kind: "image", popular: true, tags: ["أبعاد", "resize"] },
  { slug: "jpg-to-png", name: "JPG إلى PNG", description: "حوّل الصور بين الصيغ الشائعة دون رفعها إلى خادم.", category: "الصور", icon: FileImage, kind: "image", tags: ["تحويل", "png"] },
  { slug: "image-to-webp", name: "تحويل إلى WebP", description: "حوّل JPG أو PNG إلى WebP أخف للويب.", category: "الصور", icon: ImageDown, kind: "image", popular: true, tags: ["webp", "سرعة"] },
  { slug: "image-crop", name: "قص الصور", description: "قصّ الصورة بنسبة مخصصة مع معاينة فورية.", category: "الصور", icon: FileImage, kind: "image", tags: ["قص", "تحرير"] },
  { slug: "color-extractor", name: "استخراج الألوان", description: "استخرج اللون المسيطر من أي صورة محلياً.", category: "الصور", icon: Palette, kind: "image", tags: ["ألوان", "تصميم"] },
  { slug: "pdf-jpg", name: "JPG إلى PDF", description: "جهّز صورك كملف PDF واحد من داخل المتصفح.", category: "PDF", icon: FileText, kind: "image", popular: true, tags: ["pdf", "صور"] },
  { slug: "text-counter", name: "عداد الكلمات والحروف", description: "احسب الكلمات والحروف والجمل والمسافات لحظياً.", category: "النصوص", icon: Type, kind: "text", popular: true, tags: ["كلمات", "حروف"] },
  { slug: "text-cleaner", name: "منظف النصوص", description: "أزل المسافات الزائدة والأسطر الفارغة والتكرار.", category: "النصوص", icon: Sparkles, kind: "text", popular: true, tags: ["تنظيف", "تحرير"] },
  { slug: "text-compare", name: "مقارنة نصين", description: "قارن بين نصين واعرف الفقرات التي تغيرت.", category: "النصوص", icon: Braces, kind: "text", tags: ["مقارنة", "مراجعة"] },
  { slug: "link-extractor", name: "استخراج الروابط", description: "استخرج الروابط والبريد الإلكتروني من نص طويل.", category: "النصوص", icon: Link2, kind: "text", tags: ["روابط", "بريد"] },
  { slug: "slug-generator", name: "مولد Slug", description: "حوّل العناوين العربية والإنجليزية إلى روابط نظيفة.", category: "SEO", icon: Link2, kind: "text", popular: true, tags: ["slug", "seo"] },
  { slug: "meta-checker", name: "فاحص Meta", description: "راجع طول العنوان والوصف قبل نشر صفحة جديدة.", category: "SEO", icon: SearchCheck, kind: "text", tags: ["meta", "seo"] },
  { slug: "robots-generator", name: "مولد Robots.txt", description: "أنشئ ملف robots.txt واضحاً لموقعك.", category: "SEO", icon: ShieldCheck, kind: "text", tags: ["robots", "google"] },
  { slug: "json-formatter", name: "منسق JSON", description: "نسّق JSON وتحقق من سلامته مع رسائل واضحة.", category: "تقنية", icon: Braces, kind: "text", popular: true, tags: ["json", "برمجة"] },
  { slug: "password-generator", name: "مولد كلمات المرور", description: "أنشئ كلمة مرور عشوائية قوية داخل جهازك.", category: "تقنية", icon: KeyRound, kind: "utility", popular: true, tags: ["أمان", "كلمة مرور"] },
  { slug: "uuid-generator", name: "مولد UUID", description: "أنشئ معرفات UUID عشوائية للاختبار والتطوير.", category: "تقنية", icon: Braces, kind: "utility", tags: ["uuid", "تطوير"] },
  { slug: "qr-generator", name: "مولد QR", description: "حوّل نصاً أو رابطاً إلى رمز QR قابل للتنزيل.", category: "تقنية", icon: ScanLine, kind: "utility", tags: ["qr", "رابط"] },
  { slug: "color-converter", name: "محول الألوان", description: "حوّل HEX إلى RGB وHSL بسرعة.", category: "تقنية", icon: Palette, kind: "text", tags: ["hex", "rgb", "ألوان"] },
  { slug: "timestamp-converter", name: "محول Timestamp", description: "حوّل الطوابع الزمنية إلى تاريخ مقروء والعكس.", category: "تقنية", icon: Wrench, kind: "text", tags: ["وقت", "تاريخ"] },
];

export const articles = [
  { slug: "compress-images-without-losing-quality", title: "كيف تضغط الصور دون خسارة ملحوظة في الجودة؟", category: "الصور", excerpt: "دليل عملي لفهم الجودة والصيغة والأبعاد قبل رفع الصورة إلى موقعك.", readTime: "6 دقائق" },
  { slug: "jpg-png-webp-differences", title: "الفرق بين JPG وPNG وWebP ومتى تستخدم كل صيغة", category: "الصور", excerpt: "اختيار الصيغة المناسبة يوازن بين الجودة والشفافية وسرعة التحميل.", readTime: "8 دقائق" },
  { slug: "clean-text-before-publishing", title: "تنظيف النص قبل نشره: قائمة مراجعة قصيرة", category: "النصوص", excerpt: "خطوات عملية لإزالة الفراغات والتكرار والأخطاء التي تضعف القراءة.", readTime: "5 دقائق" },
  { slug: "seo-title-description-guide", title: "دليل عملي لكتابة عنوان ووصف صفحة واضحين", category: "SEO", excerpt: "كيف تكتب عنواناً مفيداً للقارئ ووصفاً يشرح الصفحة دون مبالغة.", readTime: "7 دقائق" },
  { slug: "json-validation-for-beginners", title: "فهم أخطاء JSON الشائعة وإصلاحها", category: "تقنية", excerpt: "أمثلة بسيطة تساعدك على اكتشاف الفواصل والاقتباسات غير الصحيحة.", readTime: "6 دقائق" },
  { slug: "privacy-first-browser-tools", title: "لماذا نعالج الملفات داخل المتصفح؟", category: "الخصوصية", excerpt: "شرح مبسط لفكرة المعالجة المحلية ومتى تكون أفضل من رفع الملف إلى خادم.", readTime: "5 دقائق" },
];

export function findTool(slug: string) { return tools.find((tool) => tool.slug === slug); }
