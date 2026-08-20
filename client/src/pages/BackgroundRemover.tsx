import { useRef, useState } from "react";
import { Download, Loader2, RefreshCw, ShieldCheck, Upload, WandSparkles } from "lucide-react";
import BackButton from "@/components/BackButton";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 6000;

type ProcessingState = "idle" | "preparing" | "processing" | "done";

function formatBytes(bytes: number) {
  if (!bytes) return "0 بايت";
  const units = ["بايت", "ك.ب", "م.ب"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function revoke(url?: string) {
  if (url) URL.revokeObjectURL(url);
}

export default function BackgroundRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const runRef = useRef(0);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<Blob>();
  const [resultUrl, setResultUrl] = useState("");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ProcessingState>("idle");
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    runRef.current += 1;
    revoke(preview);
    revoke(resultUrl);
    setFile(undefined);
    setPreview("");
    setResult(undefined);
    setResultUrl("");
    setMessage("");
    setProgress(0);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const acceptFile = async (candidate?: File) => {
    if (!candidate) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(candidate.type)) {
      setMessage("اختر صورة JPG أو JPEG أو PNG أو WebP صالحة.");
      return;
    }
    if (candidate.size > MAX_IMAGE_BYTES) {
      setMessage("حجم الصورة يتجاوز الحد المسموح وهو 10MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(candidate);
      const tooLarge = bitmap.width > MAX_IMAGE_DIMENSION || bitmap.height > MAX_IMAGE_DIMENSION;
      bitmap.close();
      if (tooLarge) {
        setMessage("أبعاد الصورة كبيرة جداً لمعالجة مستقرة. اختر صورة بأبعاد لا تتجاوز 6000×6000 بكسل.");
        return;
      }
    } catch {
      setMessage(candidate.type === "image/webp" ? "صيغة WebP غير مدعومة في هذا المتصفح. اختر JPG أو PNG بدلاً منها." : "تعذر قراءة الصورة. اختر ملفاً صالحاً غير تالف.");
      return;
    }
    revoke(preview);
    revoke(resultUrl);
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
    setResult(undefined);
    setResultUrl("");
    setMessage("");
    setProgress(0);
    setStatus("idle");
  };

  const process = async () => {
    if (!file) {
      setMessage("اختر صورة أولاً.");
      return;
    }
    const runId = ++runRef.current;
    setMessage("");
    setProgress(0);
    setStatus("preparing");
    try {
      const module = await import("@imgly/background-removal");
      if (runId !== runRef.current) return;
      setStatus("processing");
      const output = await module.removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          if (runId === runRef.current && total > 0) setProgress(Math.min(99, Math.round((current / total) * 100)));
        },
      });
      if (runId !== runRef.current) return;
      const url = URL.createObjectURL(output);
      setResult(output);
      setResultUrl(url);
      setProgress(100);
      setStatus("done");
    } catch (error) {
      if (runId !== runRef.current) return;
      setStatus("idle");
      setMessage(error instanceof Error && /memory|allocate|out of/i.test(error.message) ? "تعذر إكمال المعالجة بسبب ذاكرة المتصفح. أغلق التبويبات الأخرى أو اختر صورة أصغر." : "تعذر إزالة الخلفية. تأكد من دعم متصفحك للمعالجة المحلية ثم جرّب صورة أخرى.");
    }
  };

  const choose = (files: FileList | File[] | null) => {
    const candidate = files?.[0];
    if (candidate) void acceptFile(candidate);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8f4]">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <BackButton fallback="/tools" label="الأدوات" />
        <div className="mt-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#edf5ef] px-3 py-2 text-xs font-bold text-[#1c615d]"><WandSparkles size={15} /> معالجة AI محلية وخصوصية واضحة</div>
          <h1 className="text-4xl font-bold leading-tight text-[#123f45]">إزالة الخلفية من الصور مجانًا</h1>
          <p className="mt-4 max-w-3xl text-lg leading-9 text-[#687a7d]">أزل خلفية صور JPG وPNG داخل متصفحك باستخدام نموذج ذكاء اصطناعي يعمل على جهازك، ثم نزّل صورة PNG شفافة دون إرسال صورتك إلى خدمة معالجة خارجية.</p>

          <div className={`mt-8 rounded-3xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-[#d9a947] bg-[#fff9e9]" : "border-[#cddbd5] bg-white"}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(Array.from(event.dataTransfer.files)); }}>
            <Upload className="mx-auto text-[#1c615d]" size={32} />
            <p className="mt-3 font-bold text-[#123f45]">اسحب صورة هنا أو اخترها من جهازك</p>
            <p className="mt-2 text-sm text-[#718084]">JPG وJPEG وPNG وWebP عند الدعم · الحد الأقصى 10MB</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="focus-ring mt-5 rounded-xl bg-[#123f45] px-5 py-3 font-bold text-white hover:bg-[#1d5960]">اختيار صورة</button>
            <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choose(event.target.files)} />
          </div>

          {message && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold leading-7 text-red-700">{message}</p>}

          {file && <div className="mt-6 rounded-2xl border bg-white p-4"><div className="grid gap-5 md:grid-cols-2"><div><p className="mb-2 font-bold text-[#123f45]">المعاينة الأصلية</p><div className="flex min-h-56 items-center justify-center rounded-xl bg-[#f4f7f3] p-3"><img src={preview} alt={`معاينة ${file.name}`} className="max-h-72 max-w-full rounded-lg object-contain" /></div><p className="mt-2 break-words text-sm text-[#687a7d]">{file.name} · {formatBytes(file.size)}</p></div>{resultUrl ? <div><p className="mb-2 font-bold text-[#123f45]">النتيجة بخلفية شفافة</p><div className="checkerboard flex min-h-56 items-center justify-center rounded-xl p-3"><img src={resultUrl} alt="معاينة الصورة بعد إزالة الخلفية" className="max-h-72 max-w-full object-contain" /></div><p className="mt-2 text-sm font-semibold text-[#1c615d]">PNG شفاف · {formatBytes(result?.size ?? 0)}</p></div> : <div className="flex min-h-56 items-center justify-center rounded-xl bg-[#f4f7f3] p-5 text-center text-sm leading-7 text-[#687a7d]">ستظهر النتيجة هنا بعد انتهاء المعالجة.</div>}</div></div>}

          {status === "preparing" && <div role="status" className="mt-6 rounded-2xl border border-[#e6d19b] bg-[#fff9e9] p-4 text-sm leading-7 text-[#6e5720]"><Loader2 className="ml-2 inline animate-spin" size={17} /> جاري تجهيز أداة إزالة الخلفية... قد يستغرق أول استخدام وقتًا أطول بسبب تحميل نموذج الذكاء الاصطناعي.</div>}
          {status === "processing" && <div role="status" className="mt-6 rounded-2xl border border-[#cddbd5] bg-white p-4 text-sm leading-7 text-[#45666a]"><Loader2 className="ml-2 inline animate-spin" size={17} /> جارٍ إزالة الخلفية محلياً... {progress}%</div>}

          <div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={!file || status === "preparing" || status === "processing"} onClick={() => void process()} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#123f45] px-5 py-3 font-bold text-white disabled:opacity-60"><WandSparkles size={17} /> {status === "preparing" ? "جاري تجهيز الأداة" : status === "processing" ? `جاري إزالة الخلفية ${progress}%` : "إزالة الخلفية"}</button>{result && <button type="button" onClick={() => downloadBlob(result, "sabacn-background-removed.png")} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#d9a947] px-5 py-3 font-bold text-[#123f45]"><Download size={17} /> تنزيل PNG الشفاف</button>}<button type="button" onClick={reset} className="focus-ring inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold text-[#687a7d]"><RefreshCw size={17} /> إعادة ضبط</button></div>
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#edf5ef] p-4 text-sm leading-7 text-[#45666a]"><ShieldCheck className="mt-1 shrink-0 text-[#1c615d]" size={20} /><span>تبقى صورتك الأصلية محلياً داخل المتصفح ولا تُرسل إلى خدمة خارجية لمعالجة الصور. قد يحتاج المتصفح إلى تنزيل مكتبة ونموذج الذكاء الاصطناعي عند أول استخدام.</span></div>
          <div className="prose prose-lg mt-8 max-w-none text-[#45666a]"><h2 className="text-2xl font-bold text-[#123f45]">كيف تعمل إزالة الخلفية؟</h2><p>ارفع صورة شخصية أو منتج بصيغة JPG أو PNG أو WebP عند دعم المتصفح، ثم اضغط «إزالة الخلفية». تُجهّز الأداة نموذجها داخل المتصفح وتنفذ المعالجة على جهازك، وبعدها تعرض النتيجة بصيغة PNG شفافة لتتمكن من استخدامها في التصميم أو المتاجر أو منشورات التواصل. للحصول على نتيجة أفضل، اختر صورة واضحة بإضاءة جيدة وتباين مناسب بين العنصر والخلفية.</p><h2 className="mt-8 text-2xl font-bold text-[#123f45]">الأسئلة الشائعة</h2><h3 className="mt-5 text-xl font-bold text-[#123f45]">هل تُرفع الصورة إلى خادم؟</h3><p>لا تُرسل الصورة نفسها إلى خدمة معالجة خارجية؛ تبقى بياناتها داخل جلسة المتصفح. وقد تُنزّل مكتبة النموذج وموارده عند أول استخدام لتشغيل الذكاء الاصطناعي محلياً.</p><h3 className="mt-5 text-xl font-bold text-[#123f45]">لماذا قد يستغرق الاستخدام الأول وقتاً أطول؟</h3><p>لأن المتصفح يجهز مكتبة المعالجة وموارد النموذج أولاً. بعد اكتمال التجهيز قد يكون الاستخدام اللاحق أسرع بحسب الجهاز والذاكرة.</p><h3 className="mt-5 text-xl font-bold text-[#123f45]">ما حدود الأداة؟</h3><p>تدعم الأداة JPG وJPEG وPNG وWebP عند دعم المتصفح حتى 10MB للصورة، وقد تحتاج الصور الكبيرة جداً إلى جهاز بذاكرة كافية. إذا ظهرت رسالة خطأ، جرّب صورة أصغر أو أغلق التبويبات غير الضرورية.</p><div className="mt-8 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold text-[#123f45]">أدوات ذات صلة</h2><div className="mt-3 flex flex-wrap gap-3"><a href="/tools/image-compressor" className="font-bold text-[#1c615d] underline">ضغط الصور</a><a href="/tools/image-converter" className="font-bold text-[#1c615d] underline">تحويل صيغ الصور</a><a href="/tools/images-to-pdf" className="font-bold text-[#1c615d] underline">تحويل الصور إلى PDF</a></div></div></div>
        </div>
      </div>
    </div>
  );
}
