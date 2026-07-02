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
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    dotColor: "bg-muted-foreground/50",
  },
  processing: {
    label: "Processing",
    color: "text-info",
    bgColor: "bg-info-light",
    dotColor: "bg-info",
  },
  in_transit: {
    label: "In transit",
    color: "text-warning",
    bgColor: "bg-warning-light",
    dotColor: "bg-warning",
  },
  completed: {
    label: "Completed",
    color: "text-success",
    bgColor: "bg-success-light",
    dotColor: "bg-success",
  },
  failed: {
    label: "Failed",
    color: "text-danger",
    bgColor: "bg-danger-light",
    dotColor: "bg-danger",
  },
};

export const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  verified: {
    label: "Verified",
    color: "text-success",
    bgColor: "bg-success-light",
    dotColor: "bg-success",
  },
  pending: {
    label: "Pending",
    color: "text-warning",
    bgColor: "bg-warning-light",
    dotColor: "bg-warning",
  },
  failed: {
    label: "Failed",
    color: "text-danger",
    bgColor: "bg-danger-light",
    dotColor: "bg-danger",
  },
};

export function formatPHP(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return "****" + account.slice(-4);
}
