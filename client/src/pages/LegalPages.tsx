import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Globe2, MessageCircle } from "lucide-react";

export const BUSINESS_WHATSAPP_NUMBER = "9647740669189";
export const BUSINESS_WHATSAPP_URL = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`;
export const CONTACT_PAGE_TITLE = "اتصل بنا";
export const CONTACT_PAGE_INTRO = "يسعدنا استقبال استفساراتك وملاحظاتك واقتراحاتك حول الأخبار أو الموقع عبر واتساب أعمال.";
export const CONTACT_PAGE_SECTION_TITLE = "واتساب أعمال";

const pages = {
  about: {
    title: "من نحن",
    intro: "نبض العالم منصة إخبارية عربية مستقلة تجمع أبرز الأخبار من مصادر معلنة وموثوقة، وتقدمها للقارئ في صياغة عربية واضحة مع الإشارة إلى المصدر الأصلي.",
    sections: [
      { h: "مهمتنا", p: "نساعدك على متابعة الأحداث العالمية بفهم أفضل، عبر تنظيم الأخبار حسب الأقسام وإضافة ملخصات عربية موجزة لا تستبدل النص الأصلي ولا تدّعي ملكيته." },
      { h: "منهجية النشر", p: "نراجع بيانات المصدر ونحتفظ برابط الخبر الأصلي وتاريخ نشره. قد تختلف سرعة التحديث أو دقة التفاصيل بين المصادر، لذلك ننصح بالرجوع إلى المصدر الأصلي عند الحاجة." },
    ],
  },
  privacy: {
    title: "سياسة الخصوصية",
    intro: "نحترم خصوصيتك ونوضح هنا بصورة مبسطة كيف يتعامل الموقع مع البيانات وملفات الارتباط.",
    sections: [
      { h: "البيانات التي نجمعها", p: "قد تُجمع بيانات تقنية أساسية مثل نوع المتصفح والصفحات التي تمت زيارتها لأغراض الأمان وتحسين الأداء. لا نطلب بيانات شخصية لإنشاء حساب من أجل قراءة الأخبار." },
      { h: "ملفات الارتباط والإعلانات", p: "قد نستخدم مستقبلاً خدمات تحليل أو إعلانات مثل Google AdSense. قد تستخدم هذه الخدمات ملفات ارتباط وتقنيات مشابهة لتقديم إعلانات أو قياس الأداء وفق سياساتها. سنحدّث هذه الصفحة ونطلب الموافقات اللازمة عندما نفعّل هذه الخدمات." },
      { h: "اختياراتك", p: "يمكنك ضبط ملفات الارتباط من إعدادات المتصفح. للاستفسارات المتعلقة بالخصوصية، استخدم وسيلة التواصل الموضحة في صفحة اتصل بنا." },
    ],
  },
  terms: {
    title: "شروط الاستخدام",
    intro: "باستخدامك نبض العالم، توافق على استخدام الموقع بطريقة قانونية ومسؤولة.",
    sections: [
      { h: "طبيعة المحتوى", p: "الموقع يقدم معلومات إخبارية عامة مع روابط للمصادر الأصلية. لا يُعد المحتوى استشارة سياسية أو مالية أو طبية أو قانونية، ولا نضمن اكتمال كل خبر أو استمرار توفر أي رابط خارجي." },
      { h: "الاستخدام المقبول", p: "يحظر استخدام الموقع لنشر برمجيات ضارة أو محاولة تعطيل الخدمة أو إعادة نشر المحتوى بما يخالف حقوق أصحابه أو القوانين المعمول بها." },
      { h: "الروابط الخارجية", p: "قد تحتوي الصفحات على روابط لمواقع خارجية لا نتحكم بها. مسؤولية مراجعة شروط وسياسات تلك المواقع تقع على المستخدم." },
    ],
  },
  content: {
    title: "سياسة المحتوى وحقوق النشر",
    intro: "نلتزم بنسب الأخبار إلى مصادرها واحترام حقوق الملكية الفكرية.",
    sections: [
      { h: "المصادر والاقتباس", p: "الأخبار الواردة من خلاصات RSS تُعرض مع اسم المصدر ورابط الخبر الأصلي. الملخص العربي الذي يظهر أسفل العنوان صياغة تحريرية موجزة للمساعدة على الفهم، وليس بديلاً عن المصدر." },
      { h: "طلبات التصحيح أو الإزالة", p: "إذا وجدت خطأً أو محتوى يخصك وترى أنه يُعرض بطريقة غير صحيحة، يرجى التواصل مع مالك الموقع مع إرسال الرابط وشرح الطلب حتى تتم مراجعته." },
      { h: "المحتوى المحظور", p: "لا نقصد نشر محتوى ينتهك حقوق النشر أو يحرض على الكراهية أو العنف أو يخالف سياسات الناشرين. تخضع التغطية للمراجعة والتحديث عند توفر معلومات موثوقة." },
    ],
  },
  contact: {
    title: CONTACT_PAGE_TITLE,
    intro: CONTACT_PAGE_INTRO,
    sections: [
      { h: CONTACT_PAGE_SECTION_TITLE, p: "للتواصل المباشر مع إدارة نبض العالم، أرسل رسالتك عبر الرقم المخصص لخدمة واتساب أعمال. يرجى توضيح موضوع الرسالة وإرفاق رابط الخبر عند الإبلاغ عن تصحيح أو ملاحظة." },
    ],
  },
} as const;

type PageKey = keyof typeof pages;

export default function LegalPage({ page: requestedPage }: { page?: PageKey }) {
  const { page: routePage = "about" } = useParams<{ page: PageKey }>();
  const page = requestedPage ?? routePage;
  const data = pages[page as PageKey] ?? pages.about;
  const isContact = page === "contact";

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f5f0] text-[#384448]">
      <header className="border-b border-[#dedbd2] bg-white/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f3d48] text-[#d7b579]"><Globe2 size={20} /></span>
            <span className="news-serif text-xl font-bold text-[#0f3d48]">نبض العالم</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#0f3d48]"><ArrowRight size={16} /> الرئيسية</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14">
        <span className="text-xs font-bold tracking-[.16em] text-[#b78b4b]">نبض العالم</span>
        <h1 className="news-serif mt-3 text-4xl font-bold text-[#0f3d48] md:text-5xl">{data.title}</h1>
        <p className="mt-7 rounded-2xl border-r-4 border-[#b78b4b] bg-white/70 px-5 py-4 text-lg leading-9">{data.intro}</p>
        <div className="mt-10 space-y-8">
          {data.sections.map(section => <section key={section.h}><h2 className="news-serif text-2xl font-bold text-[#0f3d48]">{section.h}</h2><p className="mt-3 leading-9">{section.p}</p></section>)}
        </div>
        {isContact && <a href={BUSINESS_WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-10 flex items-center justify-between gap-4 rounded-3xl bg-[#128c7e] px-6 py-5 text-white shadow-lg shadow-[#128c7e]/20 transition hover:-translate-y-0.5 hover:bg-[#0f7b6e]">
          <span className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><MessageCircle size={25} /></span><span><strong className="block text-lg">مراسلة واتساب أعمال</strong><span className="mt-1 block text-sm text-white/80">+964 774 066 9189</span></span></span><ArrowLeft size={20} />
        </a>}
        <p className="mt-12 border-t border-[#dedbd2] pt-5 text-xs leading-7 text-[#7a8383]">هذه صفحة معلومات عامة للموقع. يظهر رقم واتساب أعمال أعلاه كوسيلة تواصل عامة بإذن مالك الموقع.</p>
      </main>
    </div>
  );
}
