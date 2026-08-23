export type CampaignType = "blood" | "volunteer" | "initiative";
export type CampaignStatus = "open" | "review" | "full";
export type BloodStatus = "needed" | "matched" | "complete";

export type Campaign = {
  id: string;
  type: CampaignType;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  registered: number;
  goal?: number;
  publisher: string;
  image: string;
  status: CampaignStatus;
  extra?: string;
};

export type BloodRequest = {
  id: string;
  bloodType: string;
  city: string;
  hospital: string;
  neededDate: string;
  details: string;
  status: BloodStatus;
  responders: number;
};

export const campaignLabels: Record<CampaignType, string> = {
  blood: "تبرع بالدم",
  volunteer: "تطوع",
  initiative: "مبادرة مجتمعية",
};

export const campaignColors: Record<CampaignType, string> = {
  blood: "#b64b4b",
  volunteer: "#1c615d",
  initiative: "#bd8426",
};

export const mockCampaigns: Campaign[] = [
  { id: "c1", type: "blood", title: "نحتاج متبرعين لفصيلة O+ في بغداد", description: "مساعدة عاجلة لطفل يحتاج إلى نقل دم في مستشفى مدينة الطب. كل تبرع قد يصنع فرقاً حقيقياً.", location: "بغداد · مدينة الطب", date: "2026-08-28", time: "09:00", registered: 8, goal: 12, publisher: "فريق أمل الطبي", image: "blood", status: "open", extra: "يرجى إحضار البطاقة الوطنية والتأكد من تناول وجبة خفيفة قبل التبرع." },
  { id: "c2", type: "volunteer", title: "تشجير ضفاف نهر دجلة", description: "صباح تطوعي لزراعة الأشجار وتنظيف المساحات القريبة من النهر بمشاركة أهل المنطقة.", location: "بغداد · أبو نؤاس", date: "2026-09-05", time: "07:30", registered: 24, goal: 40, publisher: "مساحة خضراء", image: "trees", status: "open", extra: "الأدوات والشتلات متوفرة. أحضر قبعة وماء للشرب." },
  { id: "c3", type: "initiative", title: "حقيبة المدرسة لكل طفل", description: "مبادرة محلية لجمع الحقائب والقرطاسية وتوزيعها على الأطفال قبل بدء العام الدراسي.", location: "الموصل · مركز المدينة", date: "2026-09-10", time: "16:00", registered: 17, goal: 25, publisher: "مبادرة أثر", image: "school", status: "open" },
  { id: "c4", type: "volunteer", title: "وجبات دافئة للعائلات المتعففة", description: "نستعد معاً لتجهيز وتوزيع وجبات نهاية الأسبوع للعائلات المحتاجة في الحي.", location: "البصرة · العشار", date: "2026-08-30", time: "14:00", registered: 30, goal: 30, publisher: "سواعد الخير", image: "food", status: "full" },
  { id: "c5", type: "blood", title: "حملة تبرع بالدم في أربيل", description: "يوم مفتوح للتبرع بالدم بالتعاون مع بنك الدم المركزي، مع فريق طبي متخصص.", location: "أربيل · عينكاوة", date: "2026-09-12", time: "10:00", registered: 11, goal: 50, publisher: "بنك الدم المركزي", image: "blood", status: "open" },
];

export const mockBloodRequests: BloodRequest[] = [
  { id: "b1", bloodType: "O+", city: "بغداد", hospital: "مستشفى مدينة الطب", neededDate: "2026-08-28", details: "حالة أطفال طارئة تحتاج إلى متبرعين أصحاء من الفصيلة نفسها.", status: "needed", responders: 8 },
  { id: "b2", bloodType: "A-", city: "النجف", hospital: "مستشفى الصدر التعليمي", neededDate: "2026-08-29", details: "مريض يستعد لعملية جراحية ويحتاج إلى دعم بنك الدم.", status: "matched", responders: 4 },
  { id: "b3", bloodType: "B+", city: "البصرة", hospital: "مستشفى البصرة العام", neededDate: "2026-09-02", details: "طلب تبرع مجدول ضمن حملة مجتمعية لدعم المرضى.", status: "needed", responders: 2 },
  { id: "b4", bloodType: "AB+", city: "كربلاء", hospital: "مركز الدم المركزي", neededDate: "2026-08-25", details: "تم توفير العدد المطلوب من المتبرعين.", status: "complete", responders: 7 },
];

export const currentUser = { name: "زائر SABACUN", bio: "أؤمن أن المشاركة الصغيرة تصنع أثراً كبيراً.", initials: "ز" };

export function getCampaign(id?: string) {
  return mockCampaigns.find((campaign) => campaign.id === id);
}

export function getStoredRegistrations(): string[] {
  try { return JSON.parse(localStorage.getItem("sabacn-registrations") || "[]"); } catch { return []; }
}

export function setStoredRegistrations(ids: string[]) {
  localStorage.setItem("sabacn-registrations", JSON.stringify(ids));
}

export function getStoredCreatedCampaigns(): Campaign[] {
  try { return JSON.parse(localStorage.getItem("sabacn-created-campaigns") || "[]"); } catch { return []; }
}

export function setStoredCreatedCampaigns(campaigns: Campaign[]) {
  localStorage.setItem("sabacn-created-campaigns", JSON.stringify(campaigns));
}

export function allCampaigns() {
  return [...getStoredCreatedCampaigns(), ...mockCampaigns];
}
