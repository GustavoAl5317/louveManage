export type Row = Record<string, string>;

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}

export function parseCSV(text: string): Row[] {
  const cleaned = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c === '"') {
      cur += c;
      if (inQuotes && cleaned[i + 1] === '"') {
        cur += cleaned[++i];
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "\n" && !inQuotes) {
      lines.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur.trim()) lines.push(cur);

  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (!nonEmpty.length) return [];

  const headerCells = parseLine(nonEmpty[0]).map((h) =>
    h.trim().toLowerCase().replace(/^﻿/, "")
  );

  const rows: Row[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = parseLine(nonEmpty[i]);
    const row: Row = {};
    headerCells.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function escapeCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const head = headers.map(escapeCell).join(",");
  const body = rows
    .map((r) => headers.map((h) => escapeCell(r[h])).join(","))
    .join("\n");
  return "﻿" + head + "\n" + body + "\n";
}

export function parseNumber(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  if (!Number.isNaN(n)) return n;
  return Number(v) || 0;
}
