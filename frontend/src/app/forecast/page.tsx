"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NbaShell from "@/components/NbaShell";
import { api, ApiError, Health, Leader, num, PlayerForecast, PlayerList, teamOf } from "@/lib/nba";
import { useDebounce } from "@/lib/useDebounce";

interface MetricsHeadline {
  headline: { targets: number; xgboost_clearly_better_than_naive: number; summary: string } | null;
}

const SECTIONS = [
  { href: "/forecast/players", title: "Players", text: "Search and sort every forecast player." },
  { href: "/forecast/teams", title: "Teams", text: "2026-27 rosters and their average forecast scoring." },
  { href: "/forecast/leaders", title: "Leaders", text: "Top forecasts for any statistic or season total." },
  { href: "/forecast/evaluation", title: "Evaluation", text: "How accurate the model was on unseen seasons." },
  { href: "/forecast/about", title: "Method", text: "Data, model, validation and limitations." },
];

export default function ForecastHome() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerList["items"]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [metrics, setMetrics] = useState<MetricsHeadline | null>(null);
  const [top, setTop] = useState<Leader[]>([]);
  const [offline, setOffline] = useState("");
  const dName = useDebounce(name, 250);

  useEffect(() => {
    Promise.allSettled([
      api<Health>("/health"),
      api<MetricsHeadline>("/metrics"),
      api<Leader[]>("/leaders?stat=points_per_game&limit=5"),
    ]).then(([h, m, l]) => {
      if (h.status === "fulfilled") setHealth(h.value);
      else if (h.reason instanceof ApiError) setOffline(h.reason.message);
      if (m.status === "fulfilled") setMetrics(m.value);
      if (l.status === "fulfilled") setTop(l.value);
    });
  }, []);

  useEffect(() => {
    const q = dName.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    api<PlayerList>(`/players?q=${encodeURIComponent(q)}&limit=6`)
      .then((d) => !cancelled && setSuggestions(d.items))
      .catch(() => !cancelled && setSuggestions([]));
    return () => {
      cancelled = true;
    };
  }, [dName]);

  async function forecast(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<PlayerForecast>("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: name.trim() }),
      });
      router.push(`/forecast/players/${res.player.player_identifier}`);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <NbaShell
      title="NBA Player Forecast 2026-27"
      lede="XGBoost forecasts of next-season points per game and eight other statistics for NBA rotation players, with 80% ranges and season totals."
    >
      {offline && <div className="err">{offline}</div>}

      <div className="card">
        <h3>Forecast a player</h3>
        <form onSubmit={forecast}>
          <div className="form-row">
            <label style={{ flex: 1, minWidth: 220 }}>
              Player name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Luka Dončić (accents optional)" />
            </label>
            <button className="btn" type="submit" disabled={busy || !name.trim()}>
              {busy ? "Forecasting…" : "Forecast"}
            </button>
          </div>
        </form>
        {error && <div className="err">{error}</div>}
        {suggestions.length > 0 && (
          <div className="player-list" style={{ maxHeight: "none" }}>
            {suggestions.map((p) => (
              <Link key={p.player_identifier} href={`/forecast/players/${p.player_identifier}`} className="player-chip">
                <strong>{p.player_name}</strong>
                <br />
                <span className="muted">{teamOf(p)} · {num(p.forecast_points_per_game)} PPG</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {(health || metrics?.headline) && (
        <div className="metrics-grid" style={{ marginBottom: "1.5rem" }}>
          {health && <div className="metric"><strong>{health.forecast_players}</strong><span>players forecast</span></div>}
          {health && <div className="metric"><strong>{health.final_table_rows.toLocaleString("en-US")}</strong><span>player-seasons</span></div>}
          {metrics?.headline && (
            <div className="metric">
              <strong>{metrics.headline.xgboost_clearly_better_than_naive}/{metrics.headline.targets}</strong>
              <span>stats clearly beat naive</span>
            </div>
          )}
        </div>
      )}

      {top.length > 0 && (
        <div className="card">
          <h3>Top forecast scorers</h3>
          <ol className="leaders">
            {top.map((r, i) => (
              <li key={r.player_identifier}>
                <span className="rank">{i + 1}</span>
                <div className="who">
                  <Link href={`/forecast/players/${r.player_identifier}`} className="link">{r.player_name}</Link>
                  <span className="muted">{teamOf(r)}</span>
                </div>
                <strong className="val">{num(r.value)}</strong>
              </li>
            ))}
          </ol>
          <p><Link href="/forecast/leaders" className="link">See all leaders →</Link></p>
        </div>
      )}

      <div className="grid-cards">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="link-card">
            <strong>{s.title}</strong>
            <span className="muted">{s.text}</span>
          </Link>
        ))}
      </div>
    </NbaShell>
  );
}
