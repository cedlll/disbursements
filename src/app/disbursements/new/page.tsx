"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { format, parse } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Info,
  CalendarDays,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ProcessingEstimate } from "@/components/disbursements/processing-estimate";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { formatPHP, getBankName } from "@/lib/constants";
import { csvTemplate, MOCK_NOW } from "@/lib/mock-data";
import { useFadeIn } from "@/lib/use-gsap";
import type { Disbursement } from "@/lib/mock-data";
import type { BankCode } from "@/lib/constants";

const VALID_BANK_CODES = new Set([
  "BDO", "BPI", "MBT", "UBP", "RCBC", "SBC", "PNB", "LBP", "DBP", "GCASH", "MAYA",
]);

const schema = z.object({
  recipientId: z.string().min(1, "Select a recipient"),
  amount: z.string().min(1, "Amount is required").refine(v => {
    const n = Number.parseFloat(v.replaceAll(",", ""));
    return !Number.isNaN(n) && n > 0 && n <= 999999;
  }, "Amount must be between ₱1 and ₱999,999"),
  purpose: z.string().min(1, "Purpose is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ParsedRow {
  rowNumber: number;
  recipientName: string;
  bankCode: string;
  accountNumber: string;
  amount: number;
  purpose: string;
}

interface CsvValidation {
  valid: ParsedRow[];
  invalid: { rowNumber: number; reason: string }[];
  totalAmount: number;
  totalRows: number;
}

function validateRow(
  cols: string[],
): { error?: string; row?: Omit<ParsedRow, "rowNumber"> } {
  if (cols.length < 5) return { error: "Insufficient columns" };

  const [recipientName, bankCode, accountNumber, amountStr, ...purposeParts] = cols;
  const purpose = purposeParts.join(",").trim();

  if (!recipientName) return { error: "Recipient name is required" };
  if (recipientName.length > 100) return { error: "Recipient name exceeds 100 characters" };
  if (!VALID_BANK_CODES.has(bankCode)) return { error: `Invalid bank code "${bankCode}"` };
  if (!/^\d{10,16}$/.test(accountNumber)) return { error: "Account number must be 10–16 digits" };

  const amount = Number.parseFloat(amountStr);
  if (Number.isNaN(amount) || amount <= 0 || amount > 999999) {
    return { error: "Amount must be between 1 and 999,999" };
  }
  if (!purpose) return { error: "Purpose is required" };

  return { row: { recipientName, bankCode, accountNumber, amount, purpose } };
}

function validateCsv(text: string): CsvValidation {
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return { valid: [], invalid: [], totalAmount: 0, totalRows: 0 };
  }

  const dataLines = lines.slice(1).filter((l) => l.trim() !== "");
  const valid: ParsedRow[] = [];
  const invalid: { rowNumber: number; reason: string }[] = [];

  for (let idx = 0; idx < dataLines.length; idx++) {
    const rowNumber = idx + 2;
    const cols = dataLines[idx].split(",").map((c) => c.trim());
    const result = validateRow(cols);

    if (result.error) {
      invalid.push({ rowNumber, reason: result.error });
    } else if (result.row) {
      valid.push({ rowNumber, ...result.row });
    }
  }

  return {
    valid,
    invalid,
    totalAmount: valid.reduce((sum, r) => sum + r.amount, 0),
    totalRows: dataLines.length,
  };
}

function genId(): string {
  return "DSB-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function genRef(): string {
  return "REF-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function NewDisbursementPage() {
  const router = useRouter();
  const { recipients, addDisbursement, addDisbursements } = useAppStore();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipientId: "",
      amount: "",
      purpose: "",
      date: "",
      notes: "",
    },
  });

  const [csvResult, setCsvResult] = useState<CsvValidation | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const today = MOCK_NOW.toISOString().split("T")[0];
  const formRef = useFadeIn<HTMLDivElement>({ y: 16 });

  // --- Single Transfer ---

  const amountField = register("amount");

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    amountField.onBlur(e);
    const raw = e.currentTarget.value.replaceAll(",", "");
    const n = Number.parseFloat(raw);
    if (!Number.isNaN(n) && n > 0) {
      setValue("amount", n.toLocaleString("en-US"));
    }
  };

  const onSingleSubmit = (data: FormValues) => {
    const recipient = recipients.find((r) => r.id === data.recipientId);
    if (!recipient) return;

    const amount = Number.parseFloat(data.amount.replaceAll(",", ""));
    const now = new Date();

    const disbursement: Disbursement = {
      id: genId(),
      recipientId: recipient.id,
      recipientName: recipient.name,
      bankCode: recipient.bankCode,
      accountNumber: recipient.accountNumber,
      amount,
      status: "queued",
      reference: genRef(),
      purpose: data.purpose,
      notes: data.notes ?? "",
      batchId: `BATCH-${String(Date.now()).slice(-3)}`,
      submittedBy: "admin@merchant.ph",
      submittedAt: now,
      processingAt: null,
      inTransitAt: null,
      completedAt: null,
      failedAt: null,
      failureReason: null,
      estimatedCompletion: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    };

    addDisbursement(disbursement);
    toast.success("Disbursement scheduled successfully");
    router.push("/dashboard");
  };

  // --- Bulk Upload ---

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "disbursement-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setCsvFileName(file.name);
    file.text().then((text) => {
      setCsvResult(validateCsv(text));
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleBulkSubmit = () => {
    if (!csvResult) return;

    const now = new Date();
    const batchId = `BATCH-${String(Date.now()).slice(-3)}`;

    const newDisbursements: Disbursement[] = csvResult.valid.map((row) => ({
      id: genId(),
      recipientId: "",
      recipientName: row.recipientName,
      bankCode: row.bankCode as BankCode,
      accountNumber: row.accountNumber,
      amount: row.amount,
      status: "queued" as const,
      reference: genRef(),
      purpose: row.purpose,
      notes: "",
      batchId,
      submittedBy: "admin@merchant.ph",
      submittedAt: now,
      processingAt: null,
      inTransitAt: null,
      completedAt: null,
      failedAt: null,
      failureReason: null,
      estimatedCompletion: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    }));

    addDisbursements(newDisbursements);
    setShowConfirmDialog(false);
    toast.success(`${newDisbursements.length} disbursements scheduled successfully`);
    router.push("/dashboard");
  };

  return (
    <AppShell title="New disbursement">
      <div ref={formRef} className="mx-auto max-w-3xl space-y-8">
        <Tabs defaultValue="single">
          <TabsList className="mb-8 w-full justify-start gap-1 rounded-xl bg-[#F0F2ED] p-1 sm:w-auto">
            <TabsTrigger value="single" className="rounded-[10px] px-5 py-2 text-sm font-medium">
              Single
            </TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-[10px] px-5 py-2 text-sm font-medium">
              Bulk
            </TabsTrigger>
          </TabsList>

          {/* ===== Single Transfer ===== */}
          <TabsContent value="single">
            <form onSubmit={handleSubmit(onSingleSubmit)} className="space-y-6 sm:space-y-8">
              <div className="space-y-6 rounded-2xl bg-white/70 border border-[#E8EAE4]/60 backdrop-blur-sm p-5 shadow-card sm:p-7">
                {/* Recipient */}
                <div className="space-y-2">
                  <Label htmlFor="disbursement-recipient" className="text-sm font-medium text-[#1A1D18]">
                    Recipient
                  </Label>
                  <Controller
                    name="recipientId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val as string)}
                      >
                        <SelectTrigger
                          id="disbursement-recipient"
                          aria-invalid={errors.recipientId ? true : undefined}
                          aria-describedby={
                            errors.recipientId ? "disbursement-recipient-error" : undefined
                          }
                          className="h-auto min-h-11 w-full whitespace-normal bg-white border border-[#E8EAE4] rounded-xl py-2.5 text-left text-[#1A1D18] focus:border-[#1C5C1C] focus:ring-2 focus:ring-[#1C5C1C]/10 *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:whitespace-normal"
                        >
                          <SelectValue placeholder="Select a recipient">
                            {(val) => {
                              if (!val) return "Select a recipient";
                              const r = recipients.find((x) => x.id === val);
                              return r
                                ? `${r.name} — ${getBankName(r.bankCode)}`
                                : String(val);
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {recipients.map((r) => {
                            const line = `${r.name} — ${getBankName(r.bankCode)}`;
                            return (
                              <SelectItem key={r.id} value={r.id} label={line}>
                                {line}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.recipientId && (
                    <p id="disbursement-recipient-error" className="text-sm text-[#C94A4A]" role="alert">
                      {errors.recipientId.message}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="disbursement-amount" className="text-sm font-medium text-[#1A1D18]">
                    Amount
                  </Label>
                  <Input
                    id="disbursement-amount"
                    type="text"
                    placeholder="0.00"
                    aria-invalid={errors.amount ? true : undefined}
                    aria-describedby={
                      errors.amount ? "disbursement-amount-error" : undefined
                    }
                    className="h-11 bg-white border border-[#E8EAE4] rounded-xl text-[#1A1D18] placeholder:text-[#74796F] focus:border-[#1C5C1C] focus:ring-2 focus:ring-[#1C5C1C]/10"
                    {...amountField}
                    onBlur={handleAmountBlur}
                  />
                  {errors.amount && (
                    <p id="disbursement-amount-error" className="text-sm text-[#C94A4A]" role="alert">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="disbursement-purpose" className="text-sm font-medium text-[#1A1D18]">
                    Purpose
                  </Label>
                  <Input
                    id="disbursement-purpose"
                    type="text"
                    placeholder="e.g. Salary disbursement"
                    aria-invalid={errors.purpose ? true : undefined}
                    aria-describedby={
                      errors.purpose ? "disbursement-purpose-error" : undefined
                    }
                    className="h-11 bg-white border border-[#E8EAE4] rounded-xl text-[#1A1D18] placeholder:text-[#74796F] focus:border-[#1C5C1C] focus:ring-2 focus:ring-[#1C5C1C]/10"
                    {...register("purpose")}
                  />
                  {errors.purpose && (
                    <p id="disbursement-purpose-error" className="text-sm text-[#C94A4A]" role="alert">
                      {errors.purpose.message}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="disbursement-date"
                      className="text-sm font-medium text-[#1A1D18]"
                    >
                      Date
                    </Label>
                    <Tooltip>
                      <TooltipTrigger
                        render={<span />}
                        aria-label="About disbursement date"
                        className="inline-flex cursor-help text-[#74796F] hover:text-[#1A1D18] transition-colors"
                      >
                        <Info className="h-4 w-4" aria-hidden />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Disbursements are processed in batches. Selecting today means next available batch.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => {
                      const minDate = parse(today, "yyyy-MM-dd", new Date());
                      const selected = field.value
                        ? parse(field.value, "yyyy-MM-dd", new Date())
                        : undefined;
                      return (
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                          <PopoverTrigger
                            id="disbursement-date"
                            type="button"
                            aria-invalid={errors.date ? true : undefined}
                            aria-describedby={
                              errors.date ? "disbursement-date-error" : undefined
                            }
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  "h-11 w-full justify-start rounded-xl border border-[#E8EAE4] bg-white px-3.5 text-left text-sm font-normal text-[#1A1D18] shadow-none hover:bg-[#F9FAFB] focus-visible:border-[#1C5C1C] focus-visible:ring-2 focus-visible:ring-[#1C5C1C]/10",
                                  !field.value && "text-[#74796F]",
                                )}
                              />
                            }
                          >
                            <CalendarDays
                              className="mr-2 size-4 shrink-0 text-[#74796F]"
                              aria-hidden
                            />
                            {field.value
                              ? format(
                                  parse(field.value, "yyyy-MM-dd", new Date()),
                                  "MMM d, yyyy",
                                )
                              : "Select date"}
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
                                field.onChange(d ? format(d, "yyyy-MM-dd") : "");
                                setDatePickerOpen(false);
                              }}
                              disabled={{ before: minDate }}
                              defaultMonth={selected ?? minDate}
                              showOutsideDays
                              className="rounded-lg border-0 bg-transparent p-0 shadow-none"
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  {errors.date && (
                    <p id="disbursement-date-error" className="text-sm text-[#C94A4A]" role="alert">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="disbursement-notes" className="text-sm font-medium text-[#1A1D18]">
                    Notes{" "}
                    <span className="font-normal text-[#74796F]">(optional)</span>
                  </Label>
                  <Textarea
                    id="disbursement-notes"
                    placeholder="Any additional notes..."
                    className="bg-white border border-[#E8EAE4] rounded-xl text-[#1A1D18] placeholder:text-[#74796F] min-h-[80px] focus:border-[#1C5C1C] focus:ring-2 focus:ring-[#1C5C1C]/10"
                    {...register("notes")}
                  />
                </div>
              </div>

              {/* Processing Estimate */}
              <div className="rounded-2xl bg-white/70 border border-[#E8EAE4]/60 backdrop-blur-sm p-5 shadow-card sm:p-7">
                <h3 className="mb-5 text-sm font-semibold text-[#1A1D18]">
                  Expected timeline
                </h3>
                <ProcessingEstimate status="queued" submittedAt={MOCK_NOW} />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-[#1C5C1C] px-5 font-medium text-white hover:bg-[#144A14] transition-colors"
              >
                Schedule disbursement
              </Button>
            </form>
          </TabsContent>

          {/* ===== Bulk Upload ===== */}
          <TabsContent value="bulk">
            <div className="space-y-8">
              <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1D18]">CSV template</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#74796F]">
                      Download, fill in, then upload below.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="shrink-0 rounded-xl border-[#E8EAE4] bg-[#F0F2ED] text-[#1A1D18] hover:bg-[#E8EAE4] transition-colors"
                  >
                    <Download className="mr-2 size-4" aria-hidden />
                    Download
                  </Button>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all sm:px-10 sm:py-16 ${
                  isDragActive
                    ? "border-[#1C5C1C] bg-[#F5F6F3]/20"
                    : "border-[#D4D9CE] bg-white hover:border-[#74796F]"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-4 size-9 text-[#74796F]" aria-hidden />
                {isDragActive ? (
                  <p className="text-[#1C5C1C] font-medium">Drop your CSV file here...</p>
                ) : (
                  <>
                    <p className="font-medium text-[#1A1D18]">
                      Drop a CSV here or tap to browse
                    </p>
                    <p className="mt-2 text-sm text-[#74796F]">.csv only</p>
                  </>
                )}
                {csvFileName && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FAFAF8] px-3 py-2 text-sm text-[#1A1D18]">
                    <FileText className="h-4 w-4 text-[#74796F]" aria-hidden />
                    {csvFileName}
                  </div>
                )}
              </div>

              {/* Validation Panel */}
              {csvResult && (
                <div className="space-y-5 rounded-2xl bg-white p-5 shadow-card sm:p-7">
                  <h3 className="text-sm font-semibold text-[#1A1D18]">Check results</h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    <div className="rounded-xl bg-[#F5F6F3] p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#74796F]">Rows</p>
                      <p className="mt-1 text-lg font-semibold text-[#1A1D18]">{csvResult.totalRows}</p>
                    </div>
                    <div className="rounded-xl bg-[#F5F6F3] p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#74796F]">Valid</p>
                      <p className="mt-1 text-lg font-semibold text-[#1C5C1C]">{csvResult.valid.length}</p>
                    </div>
                    <div className="rounded-xl bg-[#F5F6F3] p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#74796F]">Invalid</p>
                      <p className="mt-1 text-lg font-semibold text-[#C94A4A]">{csvResult.invalid.length}</p>
                    </div>
                    <div className="rounded-xl bg-[#F5F6F3] p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#74796F]">Total</p>
                      <p className="mt-1 text-lg font-semibold text-[#1A1D18]">
                        {formatPHP(csvResult.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {csvResult.valid.length > 0 && (
                    <div className="flex items-center gap-2 text-[#1C5C1C]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      <span className="text-sm font-medium">
                        {csvResult.valid.length} valid row(s)
                      </span>
                    </div>
                  )}

                  {csvResult.invalid.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#C94A4A]">
                        <XCircle className="h-4 w-4" aria-hidden />
                        <span className="text-sm font-medium">
                          {csvResult.invalid.length} invalid row(s)
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-lg bg-[#FAFAF8] p-3 space-y-1">
                        {csvResult.invalid.map((err) => (
                          <div key={err.rowNumber} className="flex items-start gap-2 text-xs">
                            <span className="font-mono text-[#74796F] shrink-0">
                              Row {err.rowNumber}:
                            </span>
                            <span className="text-[#C94A4A]">{err.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={csvResult.invalid.length > 0 || csvResult.valid.length === 0}
                    className="h-12 w-full bg-[#1C5C1C] hover:bg-[#144A14] text-white rounded-xl px-5 font-medium disabled:opacity-40 transition-colors"
                  >
                    Schedule {csvResult.valid.length} Disbursement(s)
                  </Button>
                </div>
              )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogContent className="bg-white border-[#E8EAE4] text-[#1A1D18]">
                <DialogHeader>
                  <DialogTitle className="text-[#1A1D18]">
                    Confirm Bulk Disbursement
                  </DialogTitle>
                </DialogHeader>
                {csvResult && (
                  <div className="space-y-3 py-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#74796F]">Total disbursements</span>
                      <span className="font-medium">{csvResult.valid.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#74796F]">Total amount</span>
                      <span className="font-medium text-[#1C5C1C]">
                        {formatPHP(csvResult.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#74796F]">Status</span>
                      <span className="font-medium">Queued for next batch</span>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    className="border-[#E8EAE4] text-[#1A1D18]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBulkSubmit}
                    className="bg-[#1C5C1C] hover:bg-[#144A14] text-white rounded-xl px-5 py-2.5 font-medium transition-colors"
                  >
                    Confirm & Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
