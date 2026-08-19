import { Link } from "wouter";
import { ArrowLeft, FileImage, FileText, ImageDown, ShieldCheck } from "lucide-react";
import BackButton from "@/components/BackButton";

const tools = [
  { href: "/tools/image-compressor", icon: ImageDown, title: "ضغط الصور اونلاين مجانًا", text: "قلّل حجم صور JPG وPNG محليًا، مع جودة قابلة للتحكم ومقارنة الحجم قبل وبعد الضغط." },
  { href: "/tools/image-converter", icon: FileImage, title: "تحويل الصور إلى JPG وPNG وWebP", text: "حوّل صورك إلى الصيغة المناسبة باستخدام Canvas داخل المتصفح، دون رفع الملفات إلى أي خادم." },
  { href: "/tools/merge-pdf", icon: FileText, title: "دمج ملفات PDF مجانًا", text: "اجمع عدة ملفات PDF في ملف واحد محليًا، مع إعادة الترتيب وكشف التكرار دون رفع ملفاتك." },
  { href: "/tools/images-to-pdf", icon: FileImage, title: "تحويل الصور إلى PDF مجانًا", text: "حوّل صور JPG وPNG وWebP إلى صفحات PDF مرتبة محليًا، دون رفع الصور إلى أي خادم." },
];

export default function Tools() {
  return <div dir="rtl" className="min-h-screen bg-[#f7f8f4]"><div className="mx-auto max-w-5xl px-4 py-10 lg:px-8"><BackButton fallback="/" label="الرئيسية" /><header className="mt-10 max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-[#edf5ef] px-3 py-2 text-xs font-bold text-[#1c615d]"><ShieldCheck size={15} /> معالجة محلية وخصوصية واضحة</div><h1 className="mt-5 text-4xl font-bold leading-tight text-[#123f45]">أدوات SABACUN الرقمية</h1><p className="mt-4 text-lg leading-9 text-[#687a7d]">ابدأ بأدوات الصور الأساسية التي تعمل داخل متصفحك دون رفع ملفاتك إلى خوادم خارجية. اختر الأداة المناسبة ثم اتبع الخطوات البسيطة.</p></header><section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="أدوات SABACUN">{tools.map(({ href, icon: Icon, title, text }) => <Link key={href} href={href} className="focus-ring group rounded-[2rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#1c615d]"><Icon size={28} /></div><h2 className="mt-6 text-2xl font-bold text-[#123f45]">{title}</h2><p className="mt-3 leading-8 text-[#687a7d]">{text}</p><span className="mt-6 inline-flex items-center gap-2 font-bold text-[#1c615d]">فتح الأداة <ArrowLeft size={17} className="transition group-hover:-translate-x-1" /></span></Link>)}</section><div className="mt-8 rounded-3xl border bg-white p-5 text-sm leading-8 text-[#53696d]"><strong className="text-[#123f45]">ملاحظة الخصوصية:</strong> ملفاتك تبقى على جهازك أثناء استخدام هذه الأدوات. لا نستخدم خدمات رفع أو معالجة خارجية للملفات.</div></div></div>;
}
