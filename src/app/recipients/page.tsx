"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type RowData,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore } from "@/lib/store";
import {
  PH_BANKS,
  getBankName,
  maskAccount,
  VERIFICATION_CONFIG,
  type BankCode,
  type VerificationStatus,
} from "@/lib/constants";
import { UserPlus, Search } from "lucide-react";
import { formatUtcMediumDate } from "@/lib/date-display";
import { toast } from "sonner";
import { useFadeIn, useTableReveal } from "@/lib/use-gsap";
import type { Recipient } from "@/lib/mock-data";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    openEditRecipient?: (r: Recipient) => void;
  }
}

const columnHelper = createColumnHelper<Recipient>();

const verificationStatuses: VerificationStatus[] = [
  "verified",
  "pending",
  "failed",
];

const verificationDot: Record<VerificationStatus, string> = {
  verified: "bg-[#4E8F4E]",
  pending: "bg-[#F96B2F]",
  failed: "bg-[#C94A4A]",
};

function RecipientEditCell({
  recipient,
  onEdit,
}: Readonly<{
  recipient: Recipient;
  onEdit: (r: Recipient) => void;
}>) {
  return (
    <button
      type="button"
      className="text-xs font-semibold text-[#1C5C1C] underline-offset-2 hover:underline"
      onClick={() => onEdit(recipient)}
    >
      Edit
    </button>
  );
}

function VerificationBadge({ status }: Readonly<{ status: VerificationStatus }>) {
  const config = VERIFICATION_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-4 ${config.bgColor} ${config.color}`}
    >
      <span
        className={`size-[3px] shrink-0 rounded-full ring-1 ring-white/80 ${verificationDot[status]}`}
        aria-hidden
      />
      {config.label}
    </span>
  );
}

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <span className="font-medium text-[#1A1D18]">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("bankCode", {
    header: "Bank",
    cell: (info) => (
      <span className="text-[#74796F]">{getBankName(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("accountNumber", {
    header: "Account",
    cell: (info) => (
      <span className="font-mono text-[#74796F]">
        {maskAccount(info.getValue())}
      </span>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("lastUsed", {
    header: "Last Used",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="text-[#74796F]">
          {val ? formatUtcMediumDate(val) : "Never"}
        </span>
      );
    },
    sortingFn: (a, b) => {
      const aVal = a.original.lastUsed?.getTime() ?? 0;
      const bVal = b.original.lastUsed?.getTime() ?? 0;
      return aVal - bVal;
    },
  }),
  columnHelper.accessor("verificationStatus", {
    header: "Verification",
    cell: (info) => <VerificationBadge status={info.getValue()} />,
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: (info) => {
      const onEdit = info.table.options.meta?.openEditRecipient;
      if (!onEdit) return null;
      return (
        <RecipientEditCell recipient={info.row.original} onEdit={onEdit} />
      );
    },
  }),
];

function getSortIndicator(sorted: false | "asc" | "desc") {
  if (sorted === "asc") return " ↑";
  if (sorted === "desc") return " ↓";
  return null;
}

type RecipientSheetMode = "add" | "edit" | null;

function RecipientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipients = useAppStore((s) => s.recipients);
  const addRecipient = useAppStore((s) => s.addRecipient);
  const updateRecipient = useAppStore((s) => s.updateRecipient);

  const [sheetMode, setSheetMode] = useState<RecipientSheetMode>(null);
  const [editBaseline, setEditBaseline] = useState<Recipient | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formName, setFormName] = useState("");
  const [formBank, setFormBank] = useState<string>("");
  const [formAccount, setFormAccount] = useState("");
  const [formAccountType, setFormAccountType] = useState<
    "savings" | "checking"
  >("savings");

  const openEditRecipient = useCallback((r: Recipient) => {
    setEditBaseline(r);
    setFormName(r.name);
    setFormBank(r.bankCode);
    setFormAccount(r.accountNumber);
    setFormAccountType(r.accountType);
    setSheetMode("edit");
  }, []);

  const filteredData = useMemo(() => {
    let data = recipients;
    if (bankFilter !== "all") {
      data = data.filter((r) => r.bankCode === bankFilter);
    }
    if (statusFilter !== "all") {
      data = data.filter((r) => r.verificationStatus === statusFilter);
    }
    return data;
  }, [recipients, bankFilter, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    meta: { openEditRecipient },
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  });

  const resetForm = useCallback(() => {
    setFormName("");
    setFormBank("");
    setFormAccount("");
    setFormAccountType("savings");
    setEditBaseline(null);
  }, []);

  const openAddRecipientSheet = useCallback(() => {
    resetForm();
    setSheetMode("add");
  }, [resetForm]);

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    openAddRecipientSheet();
    router.replace("/recipients", { scroll: false });
  }, [searchParams, router, openAddRecipientSheet]);

  function handleSaveRecipient() {
    if (!formName.trim() || !formBank || !formAccount.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (sheetMode === "edit") {
      if (!editBaseline) {
        toast.error("Could not update recipient. Please try again.");
        return;
      }
      const bankOrAccountChanged =
        formBank !== editBaseline.bankCode ||
        formAccount.trim() !== editBaseline.accountNumber ||
        formAccountType !== editBaseline.accountType;

      updateRecipient(editBaseline.id, {
        name: formName.trim(),
        bankCode: formBank as BankCode,
        accountNumber: formAccount.trim(),
        accountType: formAccountType,
        ...(bankOrAccountChanged && { verificationStatus: "pending" as const }),
      });

      if (bankOrAccountChanged) {
        toast.success(
          "Recipient updated. We'll re-verify the account before your next disbursement.",
        );
      } else {
        toast.success("Recipient updated.");
      }
      resetForm();
      setSheetMode(null);
      return;
    }

    const newRecipient: Recipient = {
      id: `RCP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      name: formName.trim(),
      bankCode: formBank as BankCode,
      accountNumber: formAccount.trim(),
      accountType: formAccountType,
      verificationStatus: "pending",
      lastUsed: null,
      createdAt: new Date(),
    };

    addRecipient(newRecipient);
    toast.success(
      "We'll verify this account before your next disbursement. This usually takes a few minutes."
    );
    resetForm();
    setSheetMode(null);
  }

  const noResults = table.getRowModel().rows.length === 0;

  const filtersRef = useFadeIn<HTMLDivElement>({ y: 14 });
  const tableRef = useTableReveal<HTMLDivElement>();

  return (
    <AppShell title="Recipients">
      <div className="flex flex-col gap-6 sm:gap-8">
      <div ref={filtersRef} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#74796F]" aria-hidden />
            <Input
              placeholder="Search by name…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.currentTarget.value)}
              className="h-10 bg-white pl-10 text-[#1A1D18] placeholder:text-[#74796F] border border-[#E8EAE4] rounded-xl focus:border-[#1C5C1C] focus:ring-2 focus:ring-[#1C5C1C]/10"
            />
          </div>

          <Select value={bankFilter} onValueChange={(val) => { if (val) setBankFilter(val); }}>
            <SelectTrigger className="h-10 w-full min-w-[10rem] bg-white border-[#E8EAE4] rounded-xl text-[#1A1D18] sm:w-[11rem]">
              <SelectValue placeholder="All Banks" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E8EAE4]">
              <SelectItem value="all">All Banks</SelectItem>
              {PH_BANKS.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
            <SelectTrigger className="h-10 w-full min-w-[9rem] bg-white border-[#E8EAE4] rounded-xl text-[#1A1D18] sm:w-[10rem]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E8EAE4]">
              <SelectItem value="all">All Status</SelectItem>
              {verificationStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {VERIFICATION_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="h-10 shrink-0 rounded-xl bg-[#1C5C1C] px-5 text-white hover:bg-[#144A14] transition-colors"
          onClick={openAddRecipientSheet}
        >
          <UserPlus className="mr-2 size-4" aria-hidden />
          Add
        </Button>
      </div>

      <div ref={tableRef} className="overflow-hidden rounded-2xl bg-white/70 border border-[#E8EAE4]/60 backdrop-blur-sm shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-[#F5F6F3]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#74796F] select-none"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {getSortIndicator(header.column.getIsSorted())}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F5F6F3] transition-colors hover:bg-[#FAFAF8]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {noResults && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-[#74796F]">
              No matches. Try another name or filter.
            </p>
          </div>
        )}
      </div>
      </div>

      <Sheet
        open={sheetMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSheetMode(null);
            resetForm();
          }
        }}
      >
        <SheetContent
          side="right"
          className="bg-white border-[#E8EAE4] overflow-y-auto"
        >
          <SheetHeader className="px-5 sm:px-6">
            <SheetTitle className="text-lg text-[#1A1D18]">
              {sheetMode === "edit" ? "Edit recipient" : "Add recipient"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-5 pb-6 pt-1 sm:px-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1D18]">Name</Label>
              <Input
                placeholder="Recipient full name"
                value={formName}
                onChange={(e) => setFormName(e.currentTarget.value)}
                className="h-11 bg-white border border-[#E8EAE4] rounded-xl text-[#1A1D18] placeholder:text-[#74796F] focus:border-[#1C5C1C] focus:ring-2 focus:ring-[#1C5C1C]/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1D18]">Bank</Label>
              <Select value={formBank} onValueChange={(val) => { if (val) setFormBank(val); }}>
                <SelectTrigger className="h-11 w-full bg-white border-[#E8EAE4] rounded-xl text-[#1A1D18]">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E8EAE4]">
                  {PH_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1A1D18]">Account Number</Label>
              <Input
                placeholder="Enter account number"
                value={formAccount}
                onChange={(e) => setFormAccount(e.currentTarget.value)}
                className="h-11 bg-white border border-[#E8EAE4] rounded-xl text-[#1A1D18] placeholder:text-[#74796F] focus:border-[#1C5C1C] focus:ring-2 focus:ring-[#1C5C1C]/10"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#1A1D18]">Account Type</Label>
              <RadioGroup
                value={formAccountType}
                onValueChange={(val: string) =>
                  setFormAccountType(val as "savings" | "checking")
                }
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="savings" />
                  <Label className="cursor-pointer text-sm text-[#74796F]">
                    Savings
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="checking" />
                  <Label className="cursor-pointer text-sm text-[#74796F]">
                    Checking
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              className="mt-4 h-11 w-full rounded-xl bg-[#1C5C1C] text-white hover:bg-[#144A14] transition-colors"
              onClick={handleSaveRecipient}
            >
              {sheetMode === "edit" ? "Save changes" : "Save"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

export default function RecipientsPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Recipients">
          <div className="mx-auto flex min-h-[12rem] max-w-[1280px] items-center justify-center text-sm text-[#74796F]">
            Loading…
          </div>
        </AppShell>
      }
    >
      <RecipientsPageContent />
    </Suspense>
  );
}
