"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NbaShell from "@/components/NbaShell";
import { api, ApiError, int, Leader, num, PER_GAME_STATS, teamOf, TOTAL_STATS } from "@/lib/nba";

export default function LeadersPage() {
  const [stat, setStat] = useState("points_per_game");
  const [limit, setLimit] = useState(10);
  const [rosterOnly, setRosterOnly] = useState(true);
  const [rows, setRows] = useState<Leader[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    api<Leader[]>(`/leaders?stat=${stat}&limit=${limit}&on_roster_only=${rosterOnly}`)
      .then((d) => {
        if (!cancelled) {
          setRows(d);
          setError("");
        }
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof ApiError ? e.message : "Something went wrong."));
    return () => {
      cancelled = true;
    };
  }, [stat, limit, rosterOnly]);

  const isTotal = stat.startsWith("total_");
  const digits = isTotal || stat === "games_played" ? 0 : 1;
  const max = Math.max(1, ...(rows || []).map((r) => r.value ?? 0));
  const label = [...PER_GAME_STATS, ...TOTAL_STATS].find(([k]) => k === stat)?.[1] ?? stat;

  return (
    <NbaShell title="Leaders" lede="Top 2026-27 forecasts for any statistic, as per-game averages or season totals.">
      <div className="card">
        <div className="form-row">
          <label>
            Statistic
            <select value={stat} onChange={(e) => setStat(e.target.value)}>
              <optgroup label="Per game">
                {PER_GAME_STATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </optgroup>
              <optgroup label="Season totals">
                {TOTAL_STATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </optgroup>
            </select>
          </label>
          <label>
            Show
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={rosterOnly} onChange={(e) => setRosterOnly(e.target.checked)} style={{ minWidth: 0 }} />
            On a roster only
          </label>
        </div>
      </div>

      {error && <div className="err">{error}</div>}
      {!rows && !error && <p className="muted">Loading…</p>}

      {rows && (
        <div className="card">
          <h3>{label}</h3>
          <ol className="leaders">
            {rows.map((r, i) => (
              <li key={r.player_identifier}>
                <span className="rank">{i + 1}</span>
                <div className="who">
                  <Link href={`/forecast/players/${r.player_identifier}`} className="link">{r.player_name}</Link>
                  <span className="muted">{[r.position, teamOf(r)].filter(Boolean).join(" · ")}</span>
                  <div className="meter"><div style={{ width: `${((r.value ?? 0) / max) * 100}%` }} /></div>
                </div>
                <strong className="val">{digits === 0 ? int(r.value) : num(r.value, digits)}</strong>
              </li>
            ))}
          </ol>
        </div>
      )}
    </NbaShell>
  );
}
