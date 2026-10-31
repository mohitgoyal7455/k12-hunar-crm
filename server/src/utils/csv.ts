/**
 * Minimal RFC 4180 CSV writer.
 * Cells starting with = + - @ are prefixed with ' so spreadsheet apps
 * don't execute user-submitted text as formulas (CSV injection).
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined) => {
    let s = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers, ...rows].map((r) => r.map(escape).join(','));
  // BOM so Excel opens UTF-8 (e.g. Hindi names) correctly.
  return '﻿' + lines.join('\r\n');
}
