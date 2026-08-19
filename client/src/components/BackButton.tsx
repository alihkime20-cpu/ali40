import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

type BackButtonProps = { fallback: string; label?: string };

export default function BackButton({ fallback, label = "رجوع" }: BackButtonProps) {
  const [, setLocation] = useLocation();
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else setLocation(fallback);
  };

  return (
    <button type="button" onClick={goBack} className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-[#1c615d]">
      <ArrowRight size={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

