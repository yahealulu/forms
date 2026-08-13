"use client";

import { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import type { ExcelColumn } from "@/shared/types";

interface UseExcelParserResult {
  parse: (file: File) => Promise<ExcelColumn[]>;
  columns: ExcelColumn[];
  /** When true, row 1 is the column title and is not imported as an option. */
  treatFirstRowAsHeader: boolean;
  setTreatFirstRowAsHeader: (value: boolean) => void;
  isParsing: boolean;
  error: string | null;
  hasFile: boolean;
  reset: () => void;
}

/**
 * useExcelParser — reads Excel/CSV via SheetJS from the first sheet.
 *
 * Two modes (user-controlled, no heuristic):
 * - treatFirstRowAsHeader = true (default): row 1 is the column title.
 * - treatFirstRowAsHeader = false: every row is an option (recovery when
 *   testers put values in A1 with no header).
 */
export function useExcelParser(): UseExcelParserResult {
  const [rows, setRows] = useState<unknown[][]>([]);
  const [treatFirstRowAsHeader, setTreatFirstRowAsHeader] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(
    () => columnsFromRows(rows, treatFirstRowAsHeader),
    [rows, treatFirstRowAsHeader]
  );

  const reset = useCallback(() => {
    setRows([]);
    setTreatFirstRowAsHeader(true);
    setError(null);
    setIsParsing(false);
  }, []);

  const parse = useCallback(async (file: File): Promise<ExcelColumn[]> => {
    setIsParsing(true);
    setError(null);
    setTreatFirstRowAsHeader(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("الملف لا يحتوي على أي أوراق بيانات");
      }
      const sheet = workbook.Sheets[firstSheetName];
      const parsedRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
        defval: "",
        raw: false,
      });

      setRows(parsedRows);
      return columnsFromRows(parsedRows, true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "تعذّرت قراءة ملف Excel";
      setError(message);
      setRows([]);
      throw err;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return {
    parse,
    columns,
    treatFirstRowAsHeader,
    setTreatFirstRowAsHeader,
    isParsing,
    error,
    hasFile: rows.length > 0,
    reset,
  };
}

export function columnsFromRows(
  rows: unknown[][],
  treatFirstRowAsHeader: boolean
): ExcelColumn[] {
  if (rows.length === 0) return [];

  const maxCols = rows.reduce((max, r) => Math.max(max, r?.length ?? 0), 0);
  if (maxCols === 0) return [];

  const headerRow = rows[0] ?? [];
  const dataRows = treatFirstRowAsHeader ? rows.slice(1) : rows;

  const detected: ExcelColumn[] = [];
  for (let colIdx = 0; colIdx < maxCols; colIdx++) {
    const values: string[] = [];
    for (const row of dataRows) {
      const cell = row?.[colIdx];
      if (cell === null || cell === undefined) continue;
      const str = String(cell).trim();
      if (str.length === 0) continue;
      values.push(str);
    }
    if (values.length === 0) continue;

    let columnLabel: string;
    if (treatFirstRowAsHeader) {
      const headerCell = headerRow[colIdx];
      const headerStr =
        headerCell === null || headerCell === undefined
          ? ""
          : String(headerCell).trim();
      columnLabel =
        headerStr.length > 0
          ? headerStr
          : inferColumnLabel(colIdx, values[0]);
    } else {
      columnLabel = inferColumnLabel(colIdx, values[0]);
    }

    detected.push({ columnLabel, values });
  }

  return detected;
}

function inferColumnLabel(colIdx: number, firstValue: string): string {
  let n = colIdx;
  let letters = "";
  while (n >= 0) {
    letters = String.fromCharCode((n % 26) + 65) + letters;
    n = Math.floor(n / 26) - 1;
  }
  const preview =
    firstValue.length > 24 ? `${firstValue.slice(0, 24)}…` : firstValue;
  return `العمود ${letters} — ${preview}`;
}
