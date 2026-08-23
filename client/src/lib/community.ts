export type CampaignType = "blood" | "volunteer";
export type CampaignStatus = "review" | "open" | "full";

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

export const campaignLabels: Record<CampaignType, string> = {
  blood: "تبرع بالدم",
  volunteer: "تطوع",
};

export const campaignColors: Record<CampaignType, string> = {
  blood: "#b64b4b",
  volunteer: "#1c615d",
};

export const currentUser = {
  name: "عضو المجتمع",
  bio: "أنشئ حملة وشارك في مبادرات نافعة لمجتمعك.",
  initials: "م",
};

export function getStoredRegistrations(): string[] {
  try {
    return JSON.parse(localStorage.getItem("sabacn-registrations") || "[]");
  } catch {
    return [];
  }
}

export function setStoredRegistrations(ids: string[]) {
  localStorage.setItem("sabacn-registrations", JSON.stringify(ids));
}

export function getStoredCreatedCampaigns(): Campaign[] {
  try {
    return JSON.parse(localStorage.getItem("sabacn-created-campaigns") || "[]");
  } catch {
    return [];
  }
}

export function setStoredCreatedCampaigns(campaigns: Campaign[]) {
  localStorage.setItem("sabacn-created-campaigns", JSON.stringify(campaigns));
}

export function allCampaigns() {
  return getStoredCreatedCampaigns();
}

export function getCampaign(id?: string) {
  return allCampaigns().find((campaign) => campaign.id === id);
}
