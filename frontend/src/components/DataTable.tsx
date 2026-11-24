import { prettyHeader, Row } from "@/lib/nba";

function cell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "–";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "–";
    if (Number.isInteger(v)) return v.toLocaleString("en-US");
    return Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2);
  }
  return String(v);
}

/** Renders any list of flat records, so it works for result files whose columns vary. */
export default function DataTable({ rows, hide = [] }: { rows: Row[] | null | undefined; hide?: string[] }) {
  if (!rows || rows.length === 0) return <p className="muted">No data available.</p>;
  const cols = Object.keys(rows[0]).filter((c) => !hide.includes(c));
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{prettyHeader(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c} className={typeof r[c] === "number" ? "num" : undefined}>
                  {cell(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
