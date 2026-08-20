import { Link } from "wouter";
import { ArrowLeft, Check, ChevronLeft, FileImage, FileText, ImageDown, LockKeyhole, Menu, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";

const tools = [
  { href: "/tools/image-compressor", icon: ImageDown, title: "ضغط الصور اونلاين مجانًا", text: "قلّل حجم صور JPG وPNG محليًا، مع جودة قابلة للتحكم ومقارنة الحجم قبل وبعد الضغط." },
  { href: "/tools/image-converter", icon: FileImage, title: "تحويل الصور إلى JPG وPNG وWebP", text: "حوّل صورك إلى الصيغة المناسبة باستخدام Canvas داخل المتصفح، دون رفع الملفات إلى أي خادم." },
  { href: "/tools/merge-pdf", icon: FileText, title: "دمج ملفات PDF مجانًا", text: "اجمع عدة ملفات PDF في ملف واحد محليًا، مع إعادة الترتيب وكشف التكرار دون رفع ملفاتك." },
  { href: "/tools/images-to-pdf", icon: FileImage, title: "تحويل الصور إلى PDF مجانًا", text: "حوّل صور JPG وPNG وWebP إلى صفحات PDF مرتبة محليًا، دون رفع الصور إلى أي خادم." },
  { href: "/tools/background-remover", icon: Sparkles, title: "إزالة الخلفية من الصور مجانًا", text: "أزل خلفية الصور محليًا داخل متصفحك وحمّل PNG شفافاً دون رفع الصورة إلى خادم معالجة." },
];

function Logo() {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-3" aria-label="SABACUN - الصفحة الرئيسية">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9a947] text-xl font-display font-bold text-[#123f45] shadow-[0_8px_20px_rgba(216,166,73,.25)]">S</span>
      <span className="font-display text-2xl font-bold tracking-wide text-[#123f45]">SABACUN</span>
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe4df]/80 bg-[#f7f8f4]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#51676b] md:flex">
          <Link className="focus-ring hover:text-[#123f45]" href="/tools">الأدوات</Link><Link className="focus-ring hover:text-[#123f45]" href="/about">من نحن</Link>
          <Link className="focus-ring hover:text-[#123f45]" href="/contact">اتصل بنا</Link>
        </nav>
        <Link href="/contact" className="focus-ring hidden rounded-xl bg-[#123f45] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#1d5960] md:block">تواصل معنا</Link>
        <button className="focus-ring rounded-xl p-2 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="فتح القائمة">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="border-t border-[#dbe4df] bg-white px-4 py-4 md:hidden"><div className="grid gap-2 text-sm font-semibold"><Link onClick={() => setOpen(false)} className="rounded-xl p-3 hover:bg-[#edf5ef]" href="/tools">الأدوات</Link><Link onClick={() => setOpen(false)} className="rounded-xl p-3 hover:bg-[#edf5ef]" href="/about">من نحن</Link><Link onClick={() => setOpen(false)} className="rounded-xl p-3 hover:bg-[#edf5ef]" href="/contact">اتصل بنا</Link></div></div>}
    </header>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const filteredTools = tools.filter((tool) => `${tool.title} ${tool.text}`.toLocaleLowerCase("ar").includes(normalizedQuery));

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="sabacn-glow sabacn-grid relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d6e3da] bg-white/80 px-4 py-2 text-xs font-bold text-[#1c615d]"><Sparkles size={15} /> مساحة عربية عملية</div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.25] tracking-tight text-[#123f45] sm:text-5xl lg:text-6xl">SABACUN، <span className="text-[#c38d26]">نبني المفيد</span> بهدوء</h1>
              <p className="mt-6 max-w-2xl text-lg leading-9 text-[#5d7174]">منصة عربية مستقلة يطوّرها مهندس علي لتقديم تجارب رقمية واضحة، مع احترام الخصوصية والابتعاد عن التعقيد.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link href="/about" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#123f45] px-5 py-3 font-bold text-white shadow-md hover:bg-[#1d5960]">تعرف علينا <ArrowLeft size={17} /></Link><Link href="/contact" className="focus-ring inline-flex items-center gap-2 rounded-xl border bg-white px-5 py-3 font-bold text-[#1c615d] hover:border-[#d9a947]">تواصل معنا</Link></div>
            </div>
            <div className="relative hidden min-h-[390px] lg:block">
              <div className="noise absolute inset-8 rotate-3 rounded-[3rem] bg-[#123f45] shadow-[0_30px_90px_rgba(18,63,69,.24)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[310px] rounded-[2rem] border border-white/20 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-xl">
                  <div className="mb-7 flex items-center justify-between"><span className="font-display text-sm tracking-[.28em] text-[#f4d384]">SABACUN / 01</span><span className="h-3 w-3 rounded-full bg-[#d9a947] shadow-[0_0_18px_#d9a947]" /></div>
                  <div className="rounded-2xl bg-white/10 p-5"><div className="mb-6 h-2 w-28 rounded-full bg-white/40" /><div className="grid grid-cols-3 gap-3">{[1, 2, 3, 4, 5, 6].map((number) => <div key={number} className={`h-16 rounded-xl border border-white/10 ${number === 1 ? "bg-[#d9a947]" : "bg-white/10"}`} />)}</div></div>
                  <div className="mt-5 flex items-center justify-between text-xs text-white/65"><span>خصوصية أولاً</span><span>تجربة واضحة</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="tools" className="mx-auto max-w-7xl px-4 py-16 lg:px-8" aria-labelledby="tools-heading">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 text-sm font-bold text-[#1c615d]">أدوات SABACUN</div><h2 id="tools-heading" className="text-3xl font-bold text-[#123f45]">اختر الأداة التي تحتاجها</h2><p className="mt-3 max-w-2xl leading-8 text-[#687a7d]">أدوات عملية تعمل داخل متصفحك مباشرة، مع بقاء ملفاتك على جهازك.</p></div><label className="relative block w-full md:max-w-xs"><span className="sr-only">ابحث عن أداة</span><Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#718084]" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن أداة" className="focus-ring w-full rounded-xl border border-[#dbe4df] bg-white py-3 pl-4 pr-11 text-sm text-[#123f45] outline-none" /></label></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredTools.map(({ href, icon: Icon, title, text }) => <Link key={href} href={href} className="focus-ring group rounded-[2rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#1c615d]"><Icon size={28} /></div><h3 className="mt-6 text-2xl font-bold text-[#123f45]">{title}</h3><p className="mt-3 leading-8 text-[#687a7d]">{text}</p><span className="mt-6 inline-flex items-center gap-2 font-bold text-[#1c615d]">فتح الأداة <ArrowLeft size={17} className="transition group-hover:-translate-x-1" /></span></Link>)}</div>
          {filteredTools.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-[#cbd9d2] bg-white p-6 text-center text-[#687a7d]">لا توجد أداة مطابقة لبحثك.</p>}
        </section>
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="noise flex flex-col gap-6 rounded-[2rem] bg-[#123f45] p-8 text-white md:flex-row md:items-center md:justify-between md:p-10">
            <div><div className="mb-4 flex items-center gap-3 text-[#f4d384]"><LockKeyhole size={20} /><span className="font-bold">الخصوصية والوضوح</span></div><h2 className="text-2xl font-bold">مساحة رقمية قيد البناء بعناية</h2><p className="mt-3 max-w-2xl leading-8 text-white/70">نوضح ما نقدمه وما لا نقدمه، ونحافظ على تواصل مباشر مع زوار SABACUN أثناء تطوير التجارب القادمة.</p></div>
            <Link href="/privacy" className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d9a947] px-5 py-3 font-bold text-[#123f45]">سياسة الخصوصية <ChevronLeft size={18} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return <footer className="border-t bg-white"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8"><div><Logo /><p className="mt-4 max-w-xs leading-7 text-[#718084]">SABACUN — مساحة عربية للتجارب الرقمية الواضحة.</p><p className="mt-3 text-sm font-semibold text-[#1c615d]">أسسها ويديرها مهندس علي</p></div><div><h3 className="mb-4 font-bold text-[#173238]">الموقع</h3><div className="grid gap-3 text-sm text-[#687a7d]"><Link href="/tools">الأدوات</Link><Link href="/about">من نحن</Link><Link href="/contact">اتصل بنا</Link></div></div><div><h3 className="mb-4 font-bold text-[#173238]">السياسات والتواصل</h3><div className="grid gap-3 text-sm text-[#687a7d]"><Link href="/privacy">الخصوصية</Link><Link href="/terms">الشروط</Link><Link href="/cookies">ملفات الارتباط</Link><Link href="/content-policy">سياسة المحتوى</Link><a href="mailto:alihkime20@gmail.com">البريد الإلكتروني</a><a href="https://wa.me/9647740669189">واتساب الأعمال</a></div></div></div><div className="border-t"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[#8a999a] sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© {new Date().getFullYear()} SABACUN. جميع الحقوق محفوظة. إدارة: مهندس علي</span><span className="inline-flex items-center gap-2"><Check size={14} className="text-[#1c615d]" /> تجربة واضحة ومسؤولة</span></div></div></footer>;
}
