"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Matcher } from "react-day-picker";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  formatUtcCsvDate,
  formatUtcCsvDateTime,
  formatUtcShortDateTime,
} from "@/lib/date-display";
import { format, parse } from "date-fns";
import {
  CalendarDays,
  Download,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/disbursements/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { formatPHP, getBankName } from "@/lib/constants";
import { useFadeIn, useTableReveal } from "@/lib/use-gsap";
import type { Disbursement } from "@/lib/mock-data";

const columnHelper = createColumnHelper<Disbursement>();

const columns = [
  columnHelper.accessor("submittedAt", {
    header: "Submitted (UTC)",
    cell: (info) => (
      <span className="whitespace-nowrap text-[#1A1D18]">
        {formatUtcShortDateTime(info.getValue())}
      </span>
    ),
    sortingFn: "datetime",
  }),
  columnHelper.accessor("recipientName", {
    header: "Recipient",
    cell: (info) => (
      <Link
        href={`/disbursements/${info.row.original.id}`}
        className="font-medium text-[#1A1D18] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C5C1C]/30"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("bankCode", {
    header: "Bank",
    cell: (info) => (
      <span className="text-[#74796F]">{getBankName(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("amount", {
    header: () => (
      <span className="block text-right">Amount</span>
    ),
    cell: (info) => (
      <span className="block font-mono text-sm font-semibold text-right tabular-nums text-[#1A1D18]">
        {formatPHP(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("reference", {
    header: "Reference",
    cell: (info) => (
      <span className="font-mono text-xs text-[#74796F]">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: () => (
      <span className="block w-full text-right">Status</span>
    ),
    cell: (info) => (
      <div className="flex justify-end">
        <StatusBadge status={info.getValue()} />
      </div>
    ),
    enableSorting: false,
  }),
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "queued", label: "Queued" },
  { value: "processing", label: "Processing" },
  { value: "in_transit", label: "In Transit" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

function historyFilterDisabledMatchers(
  disableAfter?: string,
  disableBefore?: string,
): Matcher | Matcher[] | undefined {
  const matchers: Matcher[] = [];
  if (disableAfter) {
    matchers.push({ after: parse(disableAfter, "yyyy-MM-dd", new Date()) });
  }
  if (disableBefore) {
    matchers.push({ before: parse(disableBefore, "yyyy-MM-dd", new Date()) });
  }
  if (matchers.length === 0) return undefined;
  return matchers.length === 1 ? matchers[0]! : matchers;
}

function HistoryDateFilter({
  id,
  label,
  value,
  onChange,
  placeholder,
  disableAfter,
  disableBefore,
  defaultMonth,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder: string;
  disableAfter?: string;
  disableBefore?: string;
  defaultMonth: Date;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const disabled = historyFilterDisabledMatchers(disableAfter, disableBefore);

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-[#74796F]">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 w-full min-w-0 justify-start rounded-xl border border-[#E8EAE4] bg-white px-3 text-left text-sm font-normal text-[#1A1D18] shadow-none hover:bg-[#F9FAFB] focus-visible:border-[#1C5C1C] focus-visible:ring-2 focus-visible:ring-[#1C5C1C]/10",
                !value && "text-[#74796F]",
              )}
            />
          }
        >
          <CalendarDays className="mr-2 size-4 shrink-0 text-[#74796F]" aria-hidden />
          {value
            ? format(parse(value, "yyyy-MM-dd", new Date()), "MMM d, yyyy")
            : placeholder}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto border border-border/80 p-2 shadow-modal"
          align="start"
          sideOffset={6}
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            disabled={disabled}
            defaultMonth={selected ?? defaultMonth}
            showOutsideDays
            className="rounded-lg border-0 bg-transparent p-0 shadow-none"
          />
          {value ? (
            <div className="mt-1 flex justify-end border-t border-border/60 px-1 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-[#74796F] hover:text-[#1A1D18]"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function exportCSV(data: Disbursement[]) {
  const headers = [
    "Date",
    "Recipient",
    "Bank",
    "Account Number",
    "Amount",
    "Status",
    "Reference",
    "Batch ID",
    "Submitted At",
    "Processing At",
    "In Transit At",
    "Completed At",
  ];

  const rows = data.map((d) => [
    formatUtcCsvDate(d.submittedAt),
    d.recipientName,
    getBankName(d.bankCode),
    d.accountNumber,
    d.amount.toFixed(2),
    d.status,
    d.reference,
    d.batchId,
    formatUtcCsvDateTime(d.submittedAt),
    d.processingAt ? formatUtcCsvDateTime(d.processingAt) : "",
    d.inTransitAt ? formatUtcCsvDateTime(d.inTransitAt) : "",
    d.completedAt ? formatUtcCsvDateTime(d.completedAt) : "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `disbursements-${formatUtcCsvDate(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const { disbursements } = useAppStore();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const filteredData = useMemo(() => {
    return disbursements.filter((d) => {
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (d.submittedAt < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d.submittedAt > to) return false;
      }
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (
        recipientSearch &&
        !d.recipientName.toLowerCase().includes(recipientSearch.toLowerCase())
      )
        return false;
      if (amountMin && d.amount < Number(amountMin)) return false;
      if (amountMax && d.amount > Number(amountMax)) return false;
      return true;
    });
  }, [disbursements, dateFrom, dateTo, statusFilter, recipientSearch, amountMin, amountMax]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
      sorting: [{ id: "submittedAt", desc: true }],
    },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  const filtersRef = useFadeIn<HTMLDivElement>({ y: 14 });
  const tableRef = useTableReveal<HTMLDivElement>();

  const hasActiveFilters =
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    statusFilter !== "all" ||
    Boolean(recipientSearch) ||
    Boolean(amountMin) ||
    Boolean(amountMax);

  const clearAllFilters = () => {
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setRecipientSearch("");
    setAmountMin("");
    setAmountMax("");
    table.setPageIndex(0);
  };

  return (
    <AppShell title="History">
      <div className="flex flex-col gap-8">
      <div
        ref={filtersRef}
        className="overflow-hidden rounded-2xl border border-[#E8EAE4]/60 bg-white/50 shadow-sm backdrop-blur-sm"
      >
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-6 sm:gap-x-5 sm:gap-y-4 sm:p-5">
          <div className="min-w-0 sm:col-span-3">
            <HistoryDateFilter
              id="filter-date-from"
              label="From"
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="Start date"
              disableAfter={dateTo || undefined}
              defaultMonth={
                dateFrom
                  ? parse(dateFrom, "yyyy-MM-dd", new Date())
                  : dateTo
                    ? parse(dateTo, "yyyy-MM-dd", new Date())
                    : new Date()
              }
            />
          </div>
          <div className="min-w-0 sm:col-span-3">
            <HistoryDateFilter
              id="filter-date-to"
              label="To"
              value={dateTo}
              onChange={setDateTo}
              placeholder="End date"
              disableBefore={dateFrom || undefined}
              defaultMonth={
                dateTo
                  ? parse(dateTo, "yyyy-MM-dd", new Date())
                  : dateFrom
                    ? parse(dateFrom, "yyyy-MM-dd", new Date())
                    : new Date()
              }
            />
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-2">
            <label htmlFor="filter-status" className="mb-2 block text-xs font-medium text-[#74796F]">
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(val) => { if (val) setStatusFilter(val); }}
            >
              <SelectTrigger
                id="filter-status"
                className="h-10 w-full rounded-xl border border-[#E8EAE4] bg-white text-[#1A1D18]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-[#E8EAE4] bg-white">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="filter-amount-min" className="mb-2 block text-xs font-medium text-[#74796F]">
              Min ₱
            </label>
            <Input
              id="filter-amount-min"
              type="number"
              placeholder="0"
              value={amountMin}
              onChange={(e) => setAmountMin(e.currentTarget.value)}
              className="h-10 w-full rounded-xl border border-[#E8EAE4] bg-white text-[#1A1D18]"
            />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="filter-amount-max" className="mb-2 block text-xs font-medium text-[#74796F]">
              Max ₱
            </label>
            <Input
              id="filter-amount-max"
              type="number"
              placeholder="∞"
              value={amountMax}
              onChange={(e) => setAmountMax(e.currentTarget.value)}
              className="h-10 w-full rounded-xl border border-[#E8EAE4] bg-white text-[#1A1D18]"
            />
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-6">
            <label htmlFor="filter-recipient" className="mb-2 block text-xs font-medium text-[#74796F]">
              Recipient
            </label>
            <Input
              id="filter-recipient"
              placeholder="Search by name…"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.currentTarget.value)}
              className="h-10 w-full rounded-xl border border-[#E8EAE4] bg-white text-[#1A1D18] placeholder:text-[#74796F]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E8EAE4]/70 bg-[#F7F8F5]/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasActiveFilters}
            onClick={clearAllFilters}
            className="h-9 justify-center gap-2 rounded-lg text-[#5C6158] hover:bg-[#E8EAE4]/80 hover:text-[#1A1D18] disabled:opacity-40 sm:justify-start"
          >
            <FilterX className="size-4 shrink-0" aria-hidden />
            Clear filters
          </Button>
          <div className="flex min-w-0 flex-row flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportCSV(filteredData)}
              className="h-9 gap-2 rounded-lg border-[#D5D8D0] bg-white px-3.5 text-[#1A1D18] hover:bg-[#F9FAFB]"
            >
              <Download className="size-4 shrink-0" aria-hidden />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div ref={tableRef} className="overflow-x-auto rounded-2xl bg-white/70 border border-[#E8EAE4]/60 backdrop-blur-sm shadow-card">
        <table className="w-full min-w-[800px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[#F5F6F3]"
              >
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const sortable = header.column.getCanSort();
                  const alignRight =
                    header.column.id === "status" ||
                    header.column.id === "amount";
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
                      className={cn(
                        "px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#74796F]",
                        alignRight ? "text-right" : "text-left",
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          className={cn(
                            "-mx-1 inline-flex min-h-9 w-[calc(100%+0.5rem)] items-center gap-1 rounded-md px-1 py-1 text-left text-[11px] font-semibold uppercase tracking-wider text-[#74796F] transition-colors hover:text-[#1A1D18] focus-visible:ring-2 focus-visible:ring-[#1C5C1C]/30 focus-visible:outline-none",
                            alignRight && "justify-end",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {sorted === "asc" ? " ↑" : null}
                          {sorted === "desc" ? " ↓" : null}
                        </button>
                      ) : (
                        <>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm leading-relaxed text-[#74796F]"
                >
                  No transactions match your filters. Try adjusting the date
                  range.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F5F6F3] transition-colors last:border-b-0 hover:bg-[#FAFAF8]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-5 py-4 text-sm ${
                        cell.column.id === "status" ? "text-right" : ""
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#74796F]">
          {totalRows === 0
            ? "No rows match your filters."
            : `Showing rows ${startRow}–${endRow} of ${totalRows} (${pageSize} per page)`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="text-[#74796F] hover:bg-[#E8EAE4] disabled:opacity-30"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Prev
          </Button>
          <span className="text-xs tabular-nums text-[#74796F]">
            Page {pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="text-[#74796F] hover:bg-[#E8EAE4] disabled:opacity-30"
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
