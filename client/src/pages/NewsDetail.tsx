import { useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, Clock3, ExternalLink, Globe2 } from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";
import { trpc } from "@/lib/trpc";

export default function NewsDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const article = trpc.news.bySlug.useQuery({ slug });
  const relatedInput = useMemo(() => article.data ? { id: article.data.id, category: article.data.category } : { id: 0, category: "world" }, [article.data]);
  const related = trpc.news.related.useQuery(relatedInput, { enabled: Boolean(article.data) });

  useEffect(() => {
    const item = article.data;
    if (!item) return;
    document.title = `${item.title} | نبض العالم`;
    const description = item.summary || item.title;
    const setMeta = (property: string, content: string, attribute = "name") => {
      let tag = document.head.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    setMeta("description", description);
    setMeta("og:title", item.title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "article", "property");
    setMeta("og:url", window.location.href, "property");
    if (item.imageUrl) setMeta("og:image", item.imageUrl, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", item.title);
    setMeta("twitter:description", description);
  }, [article.data]);

  if (article.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f7f5f0] text-[#0f3d48]">جارٍ تحميل الخبر...</div>;
  if (article.error) return <div className="grid min-h-screen place-items-center bg-[#f7f5f0] p-6 text-center"><div><h1 className="news-serif text-3xl font-bold text-[#0f3d48]">تعذر تحميل الخبر</h1><p className="mt-3 text-sm text-[#6d7578]">حاول تحديث الصفحة مرة أخرى.</p><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#b78b4b]">العودة إلى الرئيسية <ArrowRight size={16} /></Link></div></div>;
  if (!article.data) return <div className="grid min-h-screen place-items-center bg-[#f7f5f0] p-6 text-center"><div><h1 className="news-serif text-3xl font-bold text-[#0f3d48]">لم نعثر على هذا الخبر</h1><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#b78b4b]">العودة إلى الرئيسية <ArrowRight size={16} /></Link></div></div>;
  const item = article.data;
  return <div className="min-h-screen bg-[#f7f5f0]" dir="rtl"><header className="border-b border-[#dedbd2] bg-[#f7f5f0]/95"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f3d48] text-[#d7b579]"><Globe2 size={20} /></span><span className="news-serif text-xl font-bold text-[#0f3d48]">نبض العالم</span></Link><Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#0f3d48]"><ArrowRight size={17} /> كل الأخبار</Link></div></header><main className="mx-auto max-w-4xl px-5 py-14"><div className="mb-8 flex flex-wrap items-center gap-3 text-xs text-[#6d7578]"><span className="rounded-full bg-[#0f3d48] px-3 py-1.5 font-bold text-white">{item.sourceName}</span><span className="flex items-center gap-1.5"><Clock3 size={14} /> {new Intl.DateTimeFormat("ar", { dateStyle: "long", timeStyle: "short" }).format(new Date(item.publishedAt))}</span></div><h1 className="news-serif text-4xl font-bold leading-[1.35] text-[#0f3d48] md:text-6xl">{item.title}</h1><div className="mt-6"><ShareButtons title={item.title} /></div>{item.summary && <div className="mt-8 border-r-4 border-[#b78b4b] bg-white/60 px-5 py-4 text-lg font-medium leading-9 text-[#4a5558]">{item.summary}</div>}{item.imageUrl && <img src={item.imageUrl} alt="" className="mt-10 max-h-[480px] w-full rounded-3xl object-cover" />}<div className="mt-10 text-base leading-9 text-[#384448]"><p>{item.content || "لا يتوفر النص الكامل في موجز المصدر. يمكنك متابعة التفاصيل عبر الرابط الأصلي أدناه."}</p></div><div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#dedbd2] pt-6"><span className="text-xs text-[#8b9292]">المصدر الأصلي: {item.sourceName}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0f3d48] px-5 py-3 text-sm font-bold text-white">قراءة المصدر الأصلي <ExternalLink size={15} /></a></div><section className="mt-16 border-t border-[#dedbd2] pt-8"><h2 className="news-serif text-2xl font-bold text-[#0f3d48]">أخبار ذات صلة</h2>{related.isLoading ? <p className="mt-5 text-sm text-[#6d7578]">جارٍ تحميل الأخبار ذات الصلة...</p> : related.error ? <p className="mt-5 text-sm text-[#9b5b4d]">تعذر تحميل الأخبار ذات الصلة.</p> : related.data?.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{related.data.map(story => <Link key={story.id} href={`/news/${story.slug}`} className="rounded-2xl border border-[#dedbd2] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"><span className="text-[11px] text-[#b78b4b]">{story.sourceName}</span><h3 className="mt-2 text-sm font-bold leading-7 text-[#0f3d48]">{story.title}</h3></Link>)}</div> : <p className="mt-5 text-sm text-[#6d7578]">لا توجد أخبار ذات صلة بعد.</p>}</section></main></div>;
}
