import { Link } from "wouter";
import { Search, ArrowLeft, ArrowRight, Clock3, Radio, Globe2, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getInitialLocale, getLocaleDirection, LOCALE_STORAGE_KEY, type Locale } from "@/lib/locale";

const labels = {
  ar: { search: "ابحث في الأخبار...", english: "English", latest: "آخر الأخبار", sections: "الأقسام", about: "عن المنصة", breaking: "عاجل الآن", read: "اقرأ التفاصيل", newest: "أحدث الأخبار", auto: "تُحدّث الأخبار تلقائياً كل 30 دقيقة" },
  en: { search: "Search news...", english: "العربية", latest: "Latest news", sections: "Sections", about: "About", breaking: "Breaking", read: "Read story", newest: "Latest stories", auto: "News updates every 30 minutes" },
} as const;

const categoryKeys = ["all", "world", "politics", "economy", "sports", "technology", "health", "culture", "science", "lifestyle"] as const;
const categoryNames = { ar: ["كل الأخبار", "العالم", "سياسة", "اقتصاد", "رياضة", "تكنولوجيا", "صحة", "ثقافة", "علوم", "منوعات"], en: ["All news", "World", "Politics", "Economy", "Sports", "Technology", "Health", "Culture", "Science", "Lifestyle"] } as const;

function formatDate(value: Date | string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(value));
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const copy = labels[locale];
  const categories = categoryKeys.map((key, index) => [key, categoryNames[locale][index]] as const);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getLocaleDirection(locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);
  const query = trpc.news.list.useQuery({ category, search: search || undefined, language: locale, limit: 36 }, { refetchInterval: 60_000 });
  const stories = query.data || [];
  const featured = stories.slice(0, 5);
  const ticker = stories.filter(item => item.isBreaking).slice(0, 8);
  const activeLabel = useMemo(() => categories.find(item => item[0] === category)?.[1], [category]);

  return (
    <div className="min-h-screen bg-[#f7f5f0]" dir={getLocaleDirection(locale)}>
      <div className="bg-[#b78b4b] px-4 py-2 text-center text-xs font-semibold text-[#fffdf8]">{locale === "ar" ? "مصادر موثوقة. قراءة أعمق. صورة أوضح للعالم." : "Trusted sources. Deeper reading. A clearer view of the world."}</div>
      <header className="sticky top-0 z-30 border-b border-[#dedbd2]/80 bg-[#f7f5f0]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f3d48] text-[#d7b579] shadow-lg shadow-[#0f3d48]/15"><Globe2 size={22} /></span>
            <span><span className="news-serif block text-2xl font-bold tracking-tight text-[#0f3d48]">نبض العالم</span><span className="block text-[10px] font-semibold tracking-[.22em] text-[#b78b4b]">GLOBAL PULSE</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4a5558] lg:flex">
            <a href="#latest" className="transition-colors hover:text-[#0f3d48]">{copy.latest}</a><a href="#sections" className="transition-colors hover:text-[#0f3d48]">{copy.sections}</a><a href="#about" className="transition-colors hover:text-[#0f3d48]">{copy.about}</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="rounded-full border border-[#dedbd2] bg-white/70 px-3 py-2 text-xs font-bold text-[#0f3d48]" aria-label="تغيير اللغة">{copy.english}</button><div className="hidden items-center gap-2 rounded-full border border-[#dedbd2] bg-white/70 px-4 py-2.5 md:flex"><Search size={17} className="text-[#8b9292]" /><input aria-label={copy.search} value={search} onChange={event => setSearch(event.target.value)} placeholder={copy.search} className="w-44 bg-transparent text-sm outline-none placeholder:text-[#a0a3a0]" /></div>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-full p-2.5 text-[#0f3d48] hover:bg-white lg:hidden" aria-label="فتح القائمة">{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
        {mobileMenu && <div className="border-t border-[#dedbd2] bg-white px-5 py-4 lg:hidden"><div className="mb-3 flex items-center gap-2 rounded-full border border-[#dedbd2] px-4 py-3"><Search size={17} /><input autoFocus aria-label="بحث في الأخبار" value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث في الأخبار..." className="w-full bg-transparent text-sm outline-none" /></div><div className="flex gap-4 text-sm font-semibold"><a href="#latest">آخر الأخبار</a><a href="#sections">الأقسام</a></div></div>}
      </header>

      <div className="overflow-hidden border-b border-[#0f3d48]/20 bg-[#0f3d48] text-white"><div className="mx-auto flex max-w-7xl items-center"><div className="relative z-10 flex shrink-0 items-center gap-2 bg-[#0f3d48] py-3 pl-5 text-xs font-bold text-[#d7b579]"><Radio size={15} className="animate-pulse" /> {copy.breaking}</div><div className="overflow-hidden whitespace-nowrap"><div className="ticker-track flex gap-14 py-3 text-xs text-white/85">{ticker.length ? ticker.map(item => <span key={item.id}>● {item.title}</span>) : <span>{locale === "ar" ? "تحديثات الأخبار العاجلة ستظهر هنا فور ورودها من المصادر المعتمدة" : "Breaking news updates appear here from trusted sources"}</span>}</div></div></div></div>

      <main>
        <section className="hero-grid overflow-hidden bg-[#0f3d48] text-white"><div className="mx-auto grid max-w-7xl items-end gap-10 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24"><div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7b579]/40 bg-[#d7b579]/10 px-4 py-2 text-xs font-semibold text-[#e4c58e]"><span className="h-2 w-2 rounded-full bg-[#d7b579]" /> {locale === "ar" ? "منصة إخبارية عربية مستقلة" : "Independent Arabic news platform"}</div><h1 className="news-serif max-w-3xl text-5xl font-bold leading-[1.16] tracking-tight md:text-7xl">{locale === "ar" ? "العالم كما هو،" : "The world as it is,"}<br /><span className="text-[#d7b579]">{locale === "ar" ? "بصوت أوضح." : "with a clearer voice."}</span></h1><p className="mt-7 max-w-xl text-base leading-8 text-white/70 md:text-lg">{locale === "ar" ? "نقرأ أخبار العراق والشرق الأوسط أولاً، ثم نوسّع المشهد إلى أبرز الأحداث العالمية عبر مصادر موثوقة وخلاصة عربية واضحة." : "Follow Iraq and Middle East news first, then explore major global events through trusted sources and concise summaries."}</p><a href="#latest" className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#d7b579] px-6 py-3.5 text-sm font-bold text-[#0f3d48] transition-transform hover:-translate-y-0.5">{locale === "ar" ? "استكشف آخر الأخبار" : "Explore latest news"} {locale === "ar" ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</a></div><div className="hidden justify-end md:flex"><div className="max-w-xs border-r border-[#d7b579]/40 pr-6 text-right"><div className="news-serif text-6xl text-[#d7b579]">24/7</div><p className="mt-3 text-sm leading-7 text-white/60">{locale === "ar" ? "متابعة مستمرة لأبرز الأحداث والتحولات حول العالم، مع تحديثات دورية تلقائية." : "Continuous coverage of major events and global developments, with automatic updates."}</p></div></div></div></section>

        <section aria-label="مساحة إعلانية مستقبلية" className="mx-auto max-w-7xl px-5 pt-8"><div className="rounded-2xl border border-dashed border-[#d6d0c4] bg-white/35 px-5 py-4 text-center text-xs text-[#8b9292]">مساحة إعلانية مستقبلية · لا يتم تحميل أي إعلان قبل ربط حساب معتمد والحصول على الموافقة</div></section>
        <section id="latest" className="mx-auto max-w-7xl px-5 py-14"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#b78b4b]"><span className="h-px w-7 bg-[#b78b4b]" /> نشرة اليوم</div><h2 className="news-serif text-4xl font-bold text-[#0f3d48] md:text-5xl">{copy.newest}</h2><p className="mt-3 text-sm text-[#6d7578]">{activeLabel} · {locale === "ar" ? "أولوية العرض للعراق والشرق الأوسط" : "Iraq and Middle East stories prioritized"} · {copy.auto}</p></div><div id="sections" className="flex gap-2 overflow-x-auto pb-1">{categories.map(([key, label]) => <button key={key} onClick={() => setCategory(key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === key ? "bg-[#0f3d48] text-white" : "border border-[#dedbd2] bg-white/50 text-[#6d7578] hover:border-[#0f3d48] hover:text-[#0f3d48]"}`}>{label}</button>)}</div></div>
          {query.error ? <div className="rounded-3xl border border-[#e5c4bb] bg-[#fff7f4] px-6 py-16 text-center"><Radio className="mx-auto mb-5 text-[#b66d58]" size={30} /><h3 className="news-serif text-2xl font-bold text-[#0f3d48]">تعذر تحديث الأخبار</h3><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#8a6a63]">حدثت مشكلة مؤقتة أثناء الاتصال بمصادر الأخبار. حاول تحديث الصفحة بعد قليل.</p><button onClick={() => query.refetch()} className="mt-6 rounded-full bg-[#0f3d48] px-5 py-3 text-xs font-bold text-white">إعادة المحاولة</button></div> : query.isLoading ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-3xl bg-[#e9e6de]" /><div className="h-72 animate-pulse rounded-3xl bg-[#e9e6de]" /><div className="h-72 animate-pulse rounded-3xl bg-[#e9e6de]" /></div> : stories.length === 0 ? <div className="rounded-3xl border border-dashed border-[#cfcac0] bg-white/55 px-6 py-20 text-center"><Radio className="mx-auto mb-5 text-[#b78b4b]" size={30} /><h3 className="news-serif text-2xl font-bold text-[#0f3d48]">نستعد لاستقبال الأخبار</h3><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6d7578]">لا توجد نتائج مطابقة حالياً. جرّب تغيير القسم أو كلمة البحث، وسيستمر النظام في تحديث الأخبار تلقائياً.</p></div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featured.map((item, index) => <article key={item.id} className={`group overflow-hidden rounded-3xl border border-[#dedbd2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "md:col-span-2" : ""}`}><Link href={`/news/${item.slug}`} className="block h-full"><div className="relative min-h-48 overflow-hidden bg-[#d8e0df]">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full min-h-48 w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="hero-grid grid h-48 place-items-center bg-[#174b56] text-[#d7b579]"><Globe2 size={42} strokeWidth={1} /></div>}<span className="absolute right-4 top-4 rounded-full bg-[#f7f5f0]/90 px-3 py-1 text-[11px] font-bold text-[#0f3d48]">{item.sourceName}</span></div><div className="p-5"><div className="mb-3 flex items-center gap-2 text-[11px] text-[#8b9292]"><Clock3 size={14} /> {formatDate(item.publishedAt, locale)}</div><h3 className={`news-serif font-bold leading-8 text-[#0f3d48] ${index === 0 ? "text-2xl md:text-3xl" : "text-xl"}`}>{item.title}</h3>{item.summary && <p className="mt-3 line-clamp-2 text-sm leading-7 text-[#6d7578]">{item.summary}</p>}<span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#b78b4b]">{locale === "ar" ? "اقرأ التفاصيل" : "Read story"} {locale === "ar" ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}</span></div></Link></article>)}</div>}
        </section>
        <section id="about" className="border-t border-[#dedbd2] bg-white/40"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-12 md:flex-row md:items-center"><div><h2 className="news-serif text-2xl font-bold text-[#0f3d48]">نبض العالم</h2><p className="mt-2 max-w-xl text-sm leading-7 text-[#6d7578]">منصة تجمع الأخبار من خلاصات RSS المعلنة للمصادر، وتعرضها بترتيب واضح مع ملخص عربي موجز يساعدك على فهم السياق بسرعة.</p></div><div className="flex items-center gap-3 text-xs text-[#6d7578]"><span className="h-2 w-2 rounded-full bg-emerald-500" /> النظام مصمم للتحديث التلقائي</div></div></section>
      </main>
      <footer className="bg-[#0f3d48] px-5 py-7 text-center text-xs text-white/60"><div className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-white/75"><Link href="/about" className="hover:text-[#d7b579]">من نحن</Link><Link href="/privacy" className="hover:text-[#d7b579]">الخصوصية والارتباطات</Link><Link href="/terms" className="hover:text-[#d7b579]">شروط الاستخدام</Link><Link href="/content-policy" className="hover:text-[#d7b579]">سياسة المحتوى وحقوق النشر</Link><Link href="/contact" className="hover:text-[#d7b579]">اتصل بنا</Link></div>© {new Date().getFullYear()} نبض العالم · الأخبار تُنسب إلى مصادرها الأصلية</footer>
    </div>
  );
}
