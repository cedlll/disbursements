export const PH_BANKS = [
  { code: "BDO", name: "BDO Unibank" },
  { code: "BPI", name: "Bank of the Philippine Islands" },
  { code: "MBT", name: "Metrobank" },
  { code: "UBP", name: "UnionBank of the Philippines" },
  { code: "RCBC", name: "Rizal Commercial Banking Corporation" },
  { code: "SBC", name: "Security Bank" },
  { code: "PNB", name: "Philippine National Bank" },
  { code: "LBP", name: "Landbank of the Philippines" },
  { code: "DBP", name: "Development Bank of the Philippines" },
  { code: "GCASH", name: "GCash" },
  { code: "MAYA", name: "Maya" },
] as const;

export type BankCode = (typeof PH_BANKS)[number]["code"];

export const BANK_CODE_SET = new Set(PH_BANKS.map((b) => b.code));

export function getBankName(code: string): string {
  return PH_BANKS.find((b) => b.code === code)?.name ?? code;
}

export type DisbursementStatus =
  | "queued"
  | "processing"
  | "in_transit"
  | "completed"
  | "failed";

export type VerificationStatus = "verified" | "pending" | "failed";

export type MerchantTier = "standard" | "verified" | "premium";

export type PayoutFrequency = "monthly" | "biweekly" | "on_demand";

export const STATUS_CONFIG: Record<
  DisbursementStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  queued: {
    label: "Queued",
    color: "text-[#5C6057]",
    bgColor: "bg-[#F0F2ED]",
    dotColor: "bg-[#8A8F85]",
  },
  processing: {
    label: "Processing",
    color: "text-[#1A52C4]",
    bgColor: "bg-[#EAF1FF]",
    dotColor: "bg-[#3B7BF5]",
  },
  in_transit: {
    label: "In Transit",
    color: "text-[#8A6200]",
    bgColor: "bg-[#FDF3CC]",
    dotColor: "bg-[#D4A017]",
  },
  completed: {
    label: "Completed",
    color: "text-[#1C5C1C]",
    bgColor: "bg-[#D6E8D6]",
    dotColor: "bg-[#4E8F4E]",
  },
  failed: {
    label: "Failed",
    color: "text-[#C94A4A]",
    bgColor: "bg-[#FCEAEA]",
    dotColor: "bg-[#C94A4A]",
  },
};

export const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; bgColor: string }
> = {
  verified: {
    label: "Verified",
    color: "text-[#1C5C1C]",
    bgColor: "bg-[#D6E8D6]",
  },
  pending: {
    label: "Pending",
    color: "text-[#C24A12]",
    bgColor: "bg-[#FFF4EE]",
  },
  failed: {
    label: "Failed",
    color: "text-[#C94A4A]",
    bgColor: "bg-[#FCEAEA]",
  },
};

export function formatPHP(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return "****" + account.slice(-4);
}
