import type {
  BankCode,
  DisbursementStatus,
  VerificationStatus,
} from "./constants";

export interface Recipient {
  id: string;
  name: string;
  bankCode: BankCode;
  accountNumber: string;
  accountType: "savings" | "checking";
  verificationStatus: VerificationStatus;
  lastUsed: Date | null;
  createdAt: Date;
}

export interface Disbursement {
  id: string;
  recipientId: string;
  recipientName: string;
  bankCode: BankCode;
  accountNumber: string;
  amount: number;
  status: DisbursementStatus;
  reference: string;
  purpose: string;
  notes: string;
  batchId: string;
  submittedBy: string;
  submittedAt: Date;
  processingAt: Date | null;
  inTransitAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  estimatedCompletion: Date;
}

export interface Notification {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  disbursementId?: string;
}

/**
 * Fixed clock for mock data so server and client render identical markup (hydration-safe).
 */
export const MOCK_NOW = new Date(Date.UTC(2026, 2, 28, 12, 0, 0));

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xc0ffee42);

function randomDate(daysBack: number): Date {
  const d = new Date(MOCK_NOW.getTime());
  d.setUTCDate(d.getUTCDate() - Math.floor(rand() * daysBack));
  d.setUTCHours(7 + Math.floor(rand() * 12), Math.floor(rand() * 60), 0, 0);
  return d;
}

function genId(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += chars[Math.floor(rand() * 36)];
  }
  return s.toUpperCase();
}

function genAcct(): string {
  const len = 10 + Math.floor(rand() * 7);
  let n = "";
  for (let i = 0; i < len; i++) n += Math.floor(rand() * 10).toString();
  return n;
}

const bankCodes: BankCode[] = [
  "BDO", "BPI", "MBT", "UBP", "RCBC", "SBC", "PNB", "LBP", "DBP", "GCASH", "MAYA",
];

const firstNames = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Elena",
  "Miguel", "Sofia", "Antonio", "Isabella", "Rafael", "Carmen", "Diego",
  "Lucia", "Fernando", "Patricia", "Ricardo", "Teresa",
];

const lastNames = [
  "dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Torres", "Flores",
  "Gonzales", "Ramos", "Cruz", "Aquino", "Bautista", "Villanueva", "Castro",
  "Domingo", "Rivera", "Lim", "Tan", "Sy", "Ong",
];

const purposes = [
  "Salary disbursement", "Vendor payment", "Contractor payout",
  "Commission payment", "Reimbursement", "Refund processing",
  "Partner settlement", "Bonus payout", "Operating expense",
  "Service fee payment",
];

const failureReasons = [
  "The account number could not be found at the recipient's bank.",
  "The recipient's bank account has been closed or is inactive.",
  "The transaction was rejected due to insufficient details provided.",
  "The receiving bank is currently unable to process this transaction. Please try again later.",
  "The recipient's account has exceeded its daily receiving limit.",
];

export const recipients: Recipient[] = Array.from({ length: 20 }, (_, i) => {
  const vStatuses: VerificationStatus[] = ["verified", "verified", "verified", "verified", "pending", "failed"];
  return {
    id: `RCP-${genId()}`,
    name: `${firstNames[i]} ${lastNames[i]}`,
    bankCode: bankCodes[i % bankCodes.length],
    accountNumber: genAcct(),
    accountType: i % 3 === 0 ? "checking" : "savings",
    verificationStatus: vStatuses[i % vStatuses.length],
    lastUsed: i < 15 ? randomDate(30) : null,
    createdAt: randomDate(90),
  };
});

function buildDisbursement(i: number, status: DisbursementStatus): Disbursement {
  const r = recipients[i % recipients.length];
  const submitted = randomDate(30);
  const amount = Math.round((1500 + rand() * 83500) * 100) / 100;

  let processingAt: Date | null = null;
  let inTransitAt: Date | null = null;
  let completedAt: Date | null = null;
  let failedAt: Date | null = null;
  let failureReason: string | null = null;

  if (status !== "queued") {
    processingAt = new Date(submitted.getTime() + 1000 * 60 * 45);
  }
  if (status === "in_transit" || status === "completed") {
    inTransitAt = new Date(submitted.getTime() + 1000 * 60 * 180);
  }
  if (status === "completed") {
    completedAt = new Date(submitted.getTime() + 1000 * 60 * 60 * 18);
  }
  if (status === "failed") {
    failedAt = new Date(submitted.getTime() + 1000 * 60 * 90);
    failureReason = failureReasons[i % failureReasons.length];
  }

  const estCompletion = new Date(submitted.getTime() + 1000 * 60 * 60 * 48);

  return {
    id: `DSB-${genId()}`,
    recipientId: r.id,
    recipientName: r.name,
    bankCode: r.bankCode,
    accountNumber: r.accountNumber,
    amount,
    status,
    reference: `REF-${genId()}`,
    purpose: purposes[i % purposes.length],
    notes: i % 4 === 0 ? "Priority payment" : "",
    batchId: `BATCH-${String(Math.floor(i / 5) + 1).padStart(3, "0")}`,
    submittedBy: "admin@merchant.ph",
    submittedAt: submitted,
    processingAt,
    inTransitAt,
    completedAt,
    failedAt,
    failureReason,
    estimatedCompletion: estCompletion,
  };
}

const statusDistribution: DisbursementStatus[] = [
  ...Array(20).fill("completed"),
  ...Array(10).fill("in_transit"),
  ...Array(8).fill("processing"),
  ...Array(5).fill("queued"),
  ...Array(7).fill("failed"),
] as DisbursementStatus[];

export const disbursements: Disbursement[] = statusDistribution.map((s, i) =>
  buildDisbursement(i, s)
).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

export const notifications: Notification[] = [
  {
    id: "n1",
    message: `Disbursement to ${recipients[0].name} completed`,
    type: "success",
    timestamp: new Date(MOCK_NOW.getTime() - 1000 * 60 * 15),
    read: false,
    disbursementId: disbursements[0]?.id,
  },
  {
    id: "n2",
    message: "Batch processing started — 12 items queued",
    type: "info",
    timestamp: new Date(MOCK_NOW.getTime() - 1000 * 60 * 45),
    read: false,
  },
  {
    id: "n3",
    message: `Failed: Disbursement to ${recipients[4].name} needs your attention`,
    type: "error",
    timestamp: new Date(MOCK_NOW.getTime() - 1000 * 60 * 120),
    read: true,
    disbursementId: disbursements.find((d) => d.status === "failed")?.id,
  },
  {
    id: "n4",
    message: "Payout schedule updated to bi-weekly",
    type: "info",
    timestamp: new Date(MOCK_NOW.getTime() - 1000 * 60 * 60 * 3),
    read: true,
  },
  {
    id: "n5",
    message: `Disbursement to ${recipients[2].name} is in transit`,
    type: "info",
    timestamp: new Date(MOCK_NOW.getTime() - 1000 * 60 * 60 * 5),
    read: true,
  },
];

export const mockBalance = {
  available: 1_245_678.5,
  committed: 342_150.0,
  lastUpdated: new Date(MOCK_NOW.getTime() - 1000 * 60 * 8),
};

export function getDisbursementsByStatus(status: DisbursementStatus): Disbursement[] {
  return disbursements.filter((d) => d.status === status);
}

export function getMonthlyTotal(): number {
  const y = MOCK_NOW.getUTCFullYear();
  const m = MOCK_NOW.getUTCMonth();
  const startOfMonth = new Date(Date.UTC(y, m, 1));
  return disbursements
    .filter((d) => d.status === "completed" && d.completedAt && d.completedAt >= startOfMonth)
    .reduce((sum, d) => sum + d.amount, 0);
}

export function getPendingCount(): { count: number; total: number } {
  const pending = disbursements.filter(
    (d) => d.status === "processing" || d.status === "in_transit" || d.status === "queued"
  );
  return {
    count: pending.length,
    total: pending.reduce((sum, d) => sum + d.amount, 0),
  };
}

export function getFailedCount(): { count: number; total: number } {
  const failed = disbursements.filter((d) => d.status === "failed");
  return {
    count: failed.length,
    total: failed.reduce((sum, d) => sum + d.amount, 0),
  };
}

export function getSparklineData(): number[] {
  const data: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(MOCK_NOW.getTime());
    d.setUTCDate(d.getUTCDate() - i);
    const dayStart = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const total = disbursements
      .filter(
        (dis) =>
          dis.status === "completed" &&
          dis.completedAt &&
          dis.completedAt >= dayStart &&
          dis.completedAt < dayEnd
      )
      .reduce((s, dis) => s + dis.amount, 0);
    data.push(total);
  }
  return data;
}

export function getQueuedCount(): number {
  return disbursements.filter((d) => d.status === "queued" || d.status === "processing").length;
}

export const csvTemplate = `recipient_name,bank_code,account_number,amount,purpose
Juan dela Cruz,BDO,1234567890,5000.00,Salary disbursement
Maria Santos,BPI,9876543210123,12500.50,Vendor payment`;
