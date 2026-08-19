import { Link } from "wouter";
import { ArrowRight, Clock3 } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function Tools() {
  return <div className="min-h-screen bg-[#f7f8f4]"><div className="mx-auto max-w-4xl px-4 py-14 lg:px-8"><BackButton fallback="/" label="الرئيسية" /><div className="mt-12 rounded-[2rem] border bg-white p-8 text-center shadow-sm sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#1c615d]"><Clock3 size={30} /></div><h1 className="mt-6 text-3xl font-bold text-[#123f45]">الأدوات قيد الإعداد</h1><p className="mx-auto mt-4 max-w-2xl leading-8 text-[#687a7d]">أزلنا مجموعة الأدوات السابقة بالكامل حتى نعيد بناء أدوات SABACUN وفق متطلبات جديدة وتجربة أفضل. لا توجد أدوات متاحة حالياً، ولن يتم رفع ملفاتك أو معالجتها في هذه الصفحة.</p><Link href="/" className="focus-ring mt-8 inline-flex items-center gap-2 rounded-xl bg-[#123f45] px-5 py-3 font-bold text-white hover:bg-[#1d5960]"><ArrowRight size={17} /> العودة إلى الرئيسية</Link></div></div></div>;
}
