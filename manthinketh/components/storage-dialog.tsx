"use client";

import { Clock, Download, HardDrive, Info, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { formatRelativeTime, type ProgressSnapshot } from "@/lib/storage";
import { Modal } from "./modal";

type Props = {
  open: boolean;
  onClose: () => void;
  lastSaved: number | null;
  masteredCount: number;
  totalWords: number;
  onExport: () => ProgressSnapshot;
  onImport: (snapshot: unknown) => void;
  onReset: () => void;
};

export function StorageDialog({
  open,
  onClose,
  lastSaved,
  masteredCount,
  totalWords,
  onExport,
  onImport,
  onReset,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const snapshot = { ...onExport(), totalWords };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `as-a-man-thinketh-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setError(null);
    } catch {
      setError("Η εξαγωγή απέτυχε");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      onImport(JSON.parse(await file.text()));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Αποτυχία εισαγωγής");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} labelledBy="storage-dialog-title">
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-zinc-900 text-white dark:bg-white dark:text-black">
                <HardDrive size={18} />
              </div>
              <div>
                <div id="storage-dialog-title" className="text-[15px] font-semibold tracking-tight">
                  Αποθήκευση προόδου
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] opacity-60">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#10b981]" />
                  Αποθηκεύεται τοπικά 💾 • {formatRelativeTime(lastSaved)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Κλείσιμο"
              className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between rounded-[14px] border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-700 dark:bg-zinc-800/60">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  <Clock size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold">Τελευταία αποθήκευση</div>
                  <div className="truncate text-[11px] opacity-60">
                    {lastSaved
                      ? `${new Date(lastSaved).toLocaleString("el-GR")} • ${formatRelativeTime(lastSaved)}`
                      : "Δεν έχει αποθηκευτεί ακόμα"}
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-1 text-[11px] font-medium text-[#065f46] dark:border-[#1a3d31] dark:bg-[#0f221c] dark:text-[#a7f3d0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" /> local
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 text-[13px] font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
              >
                <Download size={16} /> Εξαγωγή προόδου
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-[13px] font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <Upload size={16} /> Εισαγωγή προόδου
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImport}
            />

            {error && (
              <div
                role="alert"
                className="rounded-[10px] border border-[#ffd5cc] bg-[#fff1ee] p-2.5 text-[11px] text-[#ff4d2e] dark:border-[#4a211c] dark:bg-[#2a1511]"
              >
                {error}
              </div>
            )}

            <div className="flex gap-2.5 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-3 dark:border-[#4a3b15] dark:bg-[#231c0a]">
              <Info size={14} className="mt-0.5 shrink-0 text-[#a16207]" />
              <div className="text-[11px] leading-[1.5] text-[#92400e] dark:text-[#fde68a]">
                Η πρόοδος και τα διαστήματα SM-2 μένουν στη συσκευή σου. Κάνε εξαγωγή για backup
                ή για μεταφορά σε άλλο κινητό.
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-2 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#ffd5cc] bg-[#fff1ee] text-[12px] font-medium text-[#7f1d1d] transition hover:bg-[#ffe4de] dark:border-[#4a211c] dark:bg-[#2a1511] dark:text-[#fecaca]"
              >
                <Trash2 size={14} /> Διαγραφή προόδου
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-5 py-3 md:px-6 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="flex items-center gap-1.5 text-[11px] opacity-60">
            <ShieldCheck size={12} /> Ιδιωτικό • χωρίς cloud
          </div>
          <div className="text-[11px] opacity-60">
            {masteredCount}/{totalWords} μαθημένες
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        labelledBy="reset-dialog-title"
        className="max-w-[360px]"
        align="center"
        zIndex="z-80"
      >
        <div className="p-5">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full border border-[#ffd5cc] bg-[#fff1ee] text-[#ff4d2e] dark:border-[#4a211c] dark:bg-[#2a1511]">
            <Trash2 size={18} />
          </div>
          <div id="reset-dialog-title" className="text-[15px] font-semibold">
            Διαγραφή προόδου;
          </div>
          <div className="mt-1 text-[13px] leading-[1.5] opacity-70">
            Αυτό θα διαγράψει όλες τις γνωστές λέξεις, τις προσπάθειες και την πρόοδο μαθημάτων. Δεν
            μπορεί να αναιρεθεί, εκτός αν έχεις κάνει εξαγωγή.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="h-10 flex-1 rounded-full bg-zinc-100 text-[13px] font-medium dark:bg-zinc-800"
            >
              Άκυρο
            </button>
            <button
              type="button"
              onClick={() => {
                onReset();
                setConfirmReset(false);
                onClose();
              }}
              className="h-10 flex-1 rounded-full bg-[#ff4d2e] text-[13px] font-medium text-white"
            >
              Διαγραφή
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
