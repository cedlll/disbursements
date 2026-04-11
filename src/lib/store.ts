import { create } from "zustand";
import type { MerchantTier, PayoutFrequency } from "./constants";
import type { Disbursement, Notification, Recipient } from "./mock-data";
import {
  disbursements as mockDisbursements,
  recipients as mockRecipients,
  notifications as mockNotifications,
  mockBalance,
  MOCK_NOW,
} from "./mock-data";

interface AppState {
  disbursements: Disbursement[];
  recipients: Recipient[];
  notifications: Notification[];
  balance: { available: number; committed: number; lastUpdated: Date };
  merchantTier: MerchantTier;
  payoutFrequency: PayoutFrequency;
  nextPayoutDate: Date;

  addDisbursement: (d: Disbursement) => void;
  addDisbursements: (ds: Disbursement[]) => void;
  updateDisbursement: (id: string, updates: Partial<Disbursement>) => void;
  /** Resets disbursements to the initial mock list (simulates a data refresh). */
  refreshDisbursements: () => void;
  addRecipient: (r: Recipient) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setPayoutFrequency: (f: PayoutFrequency) => void;
  setMerchantTier: (t: MerchantTier) => void;
}

function getNextPayoutDate(
  frequency: PayoutFrequency,
  now: Date = MOCK_NOW,
): Date {
  if (frequency === "on_demand") return new Date(now.getTime());
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const day = now.getUTCDate();
  if (frequency === "biweekly") {
    const next = new Date(Date.UTC(y, m, day));
    next.setUTCDate(day + (14 - (day % 14)));
    return next;
  }
  return new Date(Date.UTC(y, m + 1, 1));
}

export const useAppStore = create<AppState>((set) => ({
  disbursements: mockDisbursements,
  recipients: mockRecipients,
  notifications: mockNotifications,
  balance: mockBalance,
  merchantTier: "verified",
  payoutFrequency: "monthly",
  nextPayoutDate: getNextPayoutDate("monthly"),

  addDisbursement: (d) =>
    set((s) => ({ disbursements: [d, ...s.disbursements] })),

  addDisbursements: (ds) =>
    set((s) => ({ disbursements: [...ds, ...s.disbursements] })),

  updateDisbursement: (id, updates) =>
    set((s) => ({
      disbursements: s.disbursements.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  refreshDisbursements: () =>
    set({ disbursements: mockDisbursements.map((d) => ({ ...d })) }),

  addRecipient: (r) =>
    set((s) => ({ recipients: [r, ...s.recipients] })),

  updateRecipient: (id, updates) =>
    set((s) => ({
      recipients: s.recipients.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  addNotification: (n) =>
    set((s) => ({ notifications: [n, ...s.notifications] })),

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  setPayoutFrequency: (f) =>
    set({ payoutFrequency: f, nextPayoutDate: getNextPayoutDate(f) }),

  setMerchantTier: (t) => set({ merchantTier: t }),
}));
