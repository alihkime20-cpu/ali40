import { Check, Copy, Facebook, Send } from "lucide-react";
import { useState } from "react";
import { X } from "lucide-react";
import { getShareLinks } from "@/lib/share";

type ShareButtonsProps = {
  title: string;
  url?: string;
};

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const links = getShareLinks(title, shareUrl);

  const openShare = (target: string) => {
    window.open(target, "_blank", "noopener,noreferrer,width=680,height=620");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="مشاركة المقال">
      <span className="ml-2 text-xs font-bold text-[#6d7578]">شارك المقال</span>
      <button type="button" onClick={() => openShare(links.whatsapp)} className="share-button bg-[#25d366]" aria-label="مشاركة عبر واتساب" title="واتساب">واتساب</button>
      <button type="button" onClick={() => openShare(links.facebook)} className="share-button bg-[#1877f2]" aria-label="مشاركة عبر فيسبوك" title="فيسبوك"><Facebook size={15} /></button>
      <button type="button" onClick={() => openShare(links.x)} className="share-button bg-[#111827]" aria-label="مشاركة عبر إكس" title="إكس"><X size={15} /></button>
      <button type="button" onClick={() => openShare(links.telegram)} className="share-button bg-[#229ed9]" aria-label="مشاركة عبر تيليغرام" title="تيليغرام"><Send size={15} /></button>
      <button type="button" onClick={copyLink} className="share-button share-button-light border border-[#dedbd2] bg-white" aria-label="نسخ رابط المقال" title="نسخ الرابط">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
    </div>
  );
}
