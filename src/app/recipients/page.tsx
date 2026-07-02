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
import { Pencil, Search, UserPlus } from "lucide-react";
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
      className="inline-flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Edit recipient ${recipient.name}`}
      title="Edit"
      onClick={() => onEdit(recipient)}
    >
      <Pencil className="size-4 shrink-0" strokeWidth={2} aria-hidden />
    </button>
  );
}

function VerificationBadge({ status }: Readonly<{ status: VerificationStatus }>) {
  const config = VERIFICATION_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium leading-4 ${config.color}`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${config.dotColor}`}
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
      <span className="font-medium text-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("bankCode", {
    header: "Bank",
    cell: (info) => (
      <span className="text-muted-foreground">{getBankName(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("accountNumber", {
    header: "Account",
    cell: (info) => (
      <span className="font-mono text-muted-foreground">
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
        <span className="text-muted-foreground">
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
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full min-w-0 sm:max-w-xs">
            <Label
              htmlFor="recipients-search"
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              Search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="recipients-search"
                placeholder="Search by name…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.currentTarget.value)}
                className="h-10 bg-card pl-10 text-foreground placeholder:text-muted-foreground border border-input rounded-lg focus:border-ring focus:ring-2 focus:ring-ring/15"
              />
            </div>
          </div>

          <div className="w-full min-w-0 sm:w-auto">
            <Label
              htmlFor="recipients-filter-bank"
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              Bank
            </Label>
            <Select value={bankFilter} onValueChange={(val) => { if (val) setBankFilter(val); }}>
            <SelectTrigger id="recipients-filter-bank" className="h-10 w-full min-w-[10rem] bg-card border border-input rounded-lg text-foreground sm:w-[11rem]">
              <SelectValue placeholder="All banks">
                {(value) =>
                  !value || value === "all"
                    ? "All banks"
                    : getBankName(value as BankCode)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All banks">
                All banks
              </SelectItem>
              {PH_BANKS.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>

          <div className="w-full min-w-0 sm:w-auto">
            <Label
              htmlFor="recipients-filter-status"
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              Verification
            </Label>
            <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
            <SelectTrigger id="recipients-filter-status" className="h-10 w-full min-w-[9rem] bg-card border border-input rounded-lg text-foreground sm:w-[10rem]">
              <SelectValue placeholder="All status">
                {(value) =>
                  !value || value === "all"
                    ? "All status"
                    : VERIFICATION_CONFIG[value as VerificationStatus].label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All status">
                All status
              </SelectItem>
              {verificationStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {VERIFICATION_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        <Button
          className="h-10 shrink-0 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={openAddRecipientSheet}
        >
          <UserPlus className="mr-2 size-4" aria-hidden />
          Add
        </Button>
      </div>

      <div ref={tableRef} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const sortable = header.column.getCanSort();
                    let ariaSort: "ascending" | "descending" | "none" | undefined;
                    if (sortable) {
                      if (sorted === "asc") ariaSort = "ascending";
                      else if (sorted === "desc") ariaSort = "descending";
                      else ariaSort = "none";
                    }
                    return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={ariaSort}
                      className="px-5 py-3.5 text-left text-xs font-medium text-muted-foreground"
                    >
                      {sortable ? (
                        <button
                          type="button"
                          className="-mx-1 inline-flex min-h-9 w-[calc(100%+0.5rem)] items-center gap-1 rounded-md px-1 py-1 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {getSortIndicator(sorted)}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {getSortIndicator(sorted)}
                        </div>
                      )}
                    </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition-colors hover:bg-muted/40"
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
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
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
          className="overflow-y-auto"
        >
          <SheetHeader className="px-5 sm:px-6">
            <SheetTitle className="text-lg text-foreground">
              {sheetMode === "edit" ? "Edit recipient" : "Add recipient"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-5 pb-6 pt-1 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="recipient-sheet-name" className="text-sm font-medium text-foreground">
                Name
              </Label>
              <Input
                id="recipient-sheet-name"
                placeholder="Recipient full name"
                value={formName}
                onChange={(e) => setFormName(e.currentTarget.value)}
                className="h-11 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-sheet-bank" className="text-sm font-medium text-foreground">
                Bank
              </Label>
              <Select value={formBank} onValueChange={(val) => { if (val) setFormBank(val); }}>
                <SelectTrigger id="recipient-sheet-bank" className="h-11 w-full bg-card border border-input rounded-lg text-foreground">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {PH_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-sheet-account" className="text-sm font-medium text-foreground">
                Account Number
              </Label>
              <Input
                id="recipient-sheet-account"
                placeholder="Enter account number"
                value={formAccount}
                onChange={(e) => setFormAccount(e.currentTarget.value)}
                className="h-11 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/15"
              />
            </div>

            <fieldset className="space-y-3 border-0 p-0 m-0">
              <legend className="text-sm font-medium text-foreground">
                Account Type
              </legend>
              <RadioGroup
                value={formAccountType}
                onValueChange={(val: string) =>
                  setFormAccountType(val as "savings" | "checking")
                }
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="savings" id="recipient-sheet-account-savings" />
                  <Label htmlFor="recipient-sheet-account-savings" className="cursor-pointer text-sm text-muted-foreground">
                    Savings
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="checking" id="recipient-sheet-account-checking" />
                  <Label htmlFor="recipient-sheet-account-checking" className="cursor-pointer text-sm text-muted-foreground">
                    Checking
                  </Label>
                </div>
              </RadioGroup>
            </fieldset>

            <Button
              className="mt-4 h-11 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
          <div className="mx-auto flex min-h-[12rem] max-w-[1280px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        </AppShell>
      }
    >
      <RecipientsPageContent />
    </Suspense>
  );
}
