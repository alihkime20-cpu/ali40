export type CampaignType = "blood" | "volunteer";
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
};

export const campaignColors: Record<CampaignType, string> = {
  blood: "#b64b4b",
  volunteer: "#1c615d",
};

export const mockCampaigns: Campaign[] = [
  { id: "c1", type: "blood", title: "نحتاج متبرعين لفصيلة O+", description: "مساعدة عاجلة لحالة تحتاج إلى نقل دم. كل تبرع قد يصنع فرقاً حقيقياً.", location: "موقع يحدده الناشر", date: "2026-08-28", time: "09:00", registered: 8, goal: 12, publisher: "فريق أمل الطبي", image: "blood", status: "open", extra: "يرجى إحضار البطاقة الوطنية والتأكد من ملاءمة حالتك الصحية قبل التبرع." },
  { id: "c2", type: "volunteer", title: "تشجير وتنظيف مساحة عامة", description: "صباح تطوعي لزراعة الأشجار وتنظيف مساحة عامة بمشاركة أهل المجتمع.", location: "موقع يحدده الناشر", date: "2026-09-05", time: "07:30", registered: 24, goal: 40, publisher: "مساحة خضراء", image: "trees", status: "open", extra: "الأدوات والشتلات متوفرة. أحضر قبعة وماء للشرب." },
  { id: "c3", type: "blood", title: "حملة تبرع بالدم مفتوحة", description: "يوم مفتوح للتبرع بالدم بالتعاون مع بنك الدم، مع فريق طبي متخصص.", location: "موقع يحدده الناشر", date: "2026-09-12", time: "10:00", registered: 11, goal: 50, publisher: "بنك الدم المركزي", image: "blood", status: "open" },
];

export const mockBloodRequests: BloodRequest[] = [
  { id: "b1", bloodType: "O+", city: "الموقع يحدده مقدم الطلب", hospital: "جهة صحية معتمدة", neededDate: "2026-08-28", details: "حالة طارئة تحتاج إلى متبرعين أصحاء من الفصيلة نفسها.", status: "needed", responders: 8 },
  { id: "b2", bloodType: "A-", city: "الموقع يحدده مقدم الطلب", hospital: "جهة صحية معتمدة", neededDate: "2026-08-29", details: "مريض يستعد لعملية جراحية ويحتاج إلى دعم بنك الدم.", status: "matched", responders: 4 },
  { id: "b3", bloodType: "B+", city: "الموقع يحدده مقدم الطلب", hospital: "جهة صحية معتمدة", neededDate: "2026-09-02", details: "طلب تبرع مجدول لدعم المرضى.", status: "needed", responders: 2 },
  { id: "b4", bloodType: "AB+", city: "الموقع يحدده مقدم الطلب", hospital: "مركز دم معتمد", neededDate: "2026-08-25", details: "تم توفير العدد المطلوب من المتبرعين.", status: "complete", responders: 7 },
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
