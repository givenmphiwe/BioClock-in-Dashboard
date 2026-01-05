export interface UserProfile {
  uid: string;
  name: string;
  industryNumber: string;
  companyId: string;
  role: "admin" | "employee";
}

export interface Presence {
  online: boolean;
  lastSeen: number;
}
