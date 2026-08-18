import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Cookie, X } from "lucide-react";
import {
  readCookieConsent,
  writeCookieConsent,
  type CookieConsent as CookieConsentValue,
} from "@/lib/cookieConsent";

export default function CookieConsent() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(() =>
    readCookieConsent(typeof window === "undefined" ? null : window.localStorage),
  );

  useEffect(() => {
    setConsent(readCookieConsent(window.localStorage));
  }, []);

  if (consent) return null;

  const choose = (value: CookieConsentValue) => {
    writeCookieConsent(value, window.localStorage);
    setConsent(value);
  };

  return (
    <aside
      role="dialog"
      aria-label="إعدادات ملفات الارتباط"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-[#d9d3c8] bg-white p-4 shadow-[0_18px_55px_rgba(15,61,72,.18)] md:inset-x-auto md:bottom-5 md:right-5 md:left-5"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f4ead8] text-[#0f3d48]" aria-hidden="true">
          <Cookie size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[#0f3d48]">نحترم خصوصيتك</h2>
          <p className="mt-1 text-sm leading-7 text-[#5f696b]">
            نستخدم ملفات ارتباط ضرورية لتشغيل الموقع، وقد نستخدم ملفات غير ضرورية للتحليلات والإعلانات بعد تفعيلها. تعرّف على التفاصيل في{" "}
            <Link href="/privacy" className="font-bold text-[#0f3d48] underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#b78b4b]">
              سياسة الخصوصية
            </Link>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => choose("accepted")} className="inline-flex items-center gap-2 rounded-full bg-[#0f3d48] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#092d36] focus:outline-none focus:ring-2 focus:ring-[#b78b4b] focus:ring-offset-2">
              <Check size={16} /> قبول الاختيار
            </button>
            <button type="button" onClick={() => choose("rejected")} className="inline-flex items-center gap-2 rounded-full border border-[#cfc8bb] px-4 py-2 text-sm font-bold text-[#384448] transition hover:bg-[#f7f5f0] focus:outline-none focus:ring-2 focus:ring-[#b78b4b] focus:ring-offset-2">
              <X size={16} /> رفض غير الضرورية
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
