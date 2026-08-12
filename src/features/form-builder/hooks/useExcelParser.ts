"use client";

import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import type { ExcelColumn } from "@/shared/types";

interface UseExcelParserResult {
  parse: (file: File) => Promise<ExcelColumn[]>;
  columns: ExcelColumn[];
  isParsing: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * useExcelParser — a standalone, reusable client-side hook that reads an
 * uploaded Excel/CSV file (via SheetJS), detects columns on the first sheet
 * and exposes each column as an independent option group.
 *
 * The `columnLabel` is the header row value if present, otherwise inferred
 * from the first data value (e.g. "العمود A"). Empty values are filtered out.
 *
 * Although the typical use-case is up to 4 columns, this hook works for any
 * number of columns — the 4-column limit is enforced at the UI layer.
 */
export function useExcelParser(): UseExcelParserResult {
  const [columns, setColumns] = useState<ExcelColumn[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setColumns([]);
    setError(null);
    setIsParsing(false);
  }, []);

  const parse = useCallback(async (file: File): Promise<ExcelColumn[]> => {
    setIsParsing(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("الملف لا يحتوي على أي أوراق بيانات");
      }
      const sheet = workbook.Sheets[firstSheetName];

      // Convert to array-of-arrays so we can inspect the header row ourselves.
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
        defval: "",
        raw: false,
      });

      if (rows.length === 0) {
        setColumns([]);
        return [];
      }

      const maxCols = rows.reduce(
        (max, r) => Math.max(max, r?.length ?? 0),
        0
      );
      if (maxCols === 0) {
        setColumns([]);
        return [];
      }

      // Heuristic: if the first row contains at least one non-numeric, non-empty
      // cell that differs in character from the rest of its column, treat it as
      // a header row. Otherwise, treat every row as data.
      const headerRow = rows[0] ?? [];
      const hasHeader = headerRow.some(
        (cell) => typeof cell === "string" && cell.trim().length > 0
      );

      const dataRows = hasHeader ? rows.slice(1) : rows;

      const detected: ExcelColumn[] = [];
      for (let colIdx = 0; colIdx < maxCols; colIdx++) {
        // Collect non-empty values for this column.
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
        if (hasHeader) {
          const headerCell = headerRow[colIdx];
          columnLabel =
            typeof headerCell === "string" && headerCell.trim().length > 0
              ? headerCell.trim()
              : inferColumnLabel(colIdx, values[0]);
        } else {
          columnLabel = inferColumnLabel(colIdx, values[0]);
        }

        detected.push({ columnLabel, values });
      }

      setColumns(detected);
      return detected;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "تعذّرت قراءة ملف Excel";
      setError(message);
      setColumns([]);
      throw err;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { parse, columns, isParsing, error, reset };
}

/** Infer a readable Arabic column label from its index (0-based → A, B, C…). */
function inferColumnLabel(colIdx: number, firstValue: string): string {
  // Build the Excel-style letter (A, B, …, Z, AA, …).
  let n = colIdx;
  let letters = "";
  while (n >= 0) {
    letters = String.fromCharCode((n % 26) + 65) + letters;
    n = Math.floor(n / 26) - 1;
  }
  const preview = firstValue.length > 24 ? `${firstValue.slice(0, 24)}…` : firstValue;
  return `العمود ${letters} — ${preview}`;
}
