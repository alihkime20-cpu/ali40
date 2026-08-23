import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div dir="rtl" className="flex min-h-screen w-full items-center justify-center bg-[#f5f8f5]">
      <Card className="mx-4 w-full max-w-lg border-[#dce7df] bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="mb-5 flex justify-center"><AlertCircle className="h-14 w-14 text-[#bd8426]" /></div>
          <h1 className="mb-2 text-4xl font-bold text-[#123f45]">404</h1>
          <h2 className="mb-3 text-xl font-bold text-[#123f45]">الصفحة غير موجودة</h2>
          <p className="mb-7 leading-8 text-[#647779]">يبدو أن الرابط الذي فتحته غير متاح أو تم نقله. يمكنك العودة إلى حملات SABACUN المجتمعية.</p>
          <Button onClick={() => setLocation("/")} className="bg-[#123f45] text-white hover:bg-[#1c615d]"><Home className="ml-2 h-4 w-4" /> العودة إلى الرئيسية</Button>
        </CardContent>
      </Card>
    </div>
  );
}
