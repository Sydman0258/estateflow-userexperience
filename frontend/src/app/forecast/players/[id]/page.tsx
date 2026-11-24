"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import NbaShell from "@/components/NbaShell";
import {
  api, ApiError, HistoryRow, int, num, pct, PlayerForecast, seasonLabel, signed, StatForecast, teamOf,
} from "@/lib/nba";

function PointsChart({ data }: { data: PlayerForecast }) {
  const pts = data.stats.find((s) => s.key === "points_per_game");
  const hist = data.history
    .map((h) => ({ season: Number(h.season), v: Number(h.points_per_game) }))
    .filter((h) => Number.isFinite(h.season) && Number.isFinite(h.v));
  if (!pts || pts.forecast === null || hist.length === 0) return null;

  const W = 640, H = 220, L = 40, R = 16, T = 16, B = 30;
  const seasons = [...hist.map((h) => h.season), data.forecast_season];
  const lo = Math.min(...hist.map((h) => h.v), pts.lower_80 ?? pts.forecast);
  const hi = Math.max(...hist.map((h) => h.v), pts.upper_80 ?? pts.forecast);
  const y0 = Math.max(0, Math.floor(lo - 2));
  const y1 = Math.ceil(hi + 2);
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, seasons.length - 1);
  const y = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const line = hist.map((h, i) => `${x(i)},${y(h.v)}`).join(" ");
  const fx = x(seasons.length - 1);
  const ticks = [y0, (y0 + y1) / 2, y1];

  return (
    <div className="card">
      <h3>Points per game by season</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Points per game history and forecast">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--mute)">{Math.round(t)}</text>
          </g>
        ))}
        <polyline points={line} fill="none" stroke="var(--teal)" strokeWidth="2.5" />
        {hist.map((h, i) => <circle key={h.season} cx={x(i)} cy={y(h.v)} r="4" fill="var(--teal)" />)}
        {hist.length > 0 && (
          <line x1={x(hist.length - 1)} y1={y(hist[hist.length - 1].v)} x2={fx} y2={y(pts.forecast)}
            stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 4" />
        )}
        {pts.lower_80 !== null && pts.upper_80 !== null && (
          <line x1={fx} x2={fx} y1={y(pts.lower_80)} y2={y(pts.upper_80)} stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
        )}
        <circle cx={fx} cy={y(pts.forecast)} r="6" fill="var(--accent)" />
        {seasons.map((s, i) => (
          <text key={s} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--mute)">
            {seasonLabel(s)}
          </text>
        ))}
      </svg>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Teal: past seasons. Red: {data.forecast_season_label} forecast with its 80% range.
      </p>
    </div>
  );
}

const HISTORY_COLS: [string, string, (v: unknown) => string][] = [
  ["season", "Season", (v) => seasonLabel(v as number)],
  ["age", "Age", (v) => num(v, 0)],
  ["main_team_name", "Team", (v) => (v ? String(v) : "–")],
  ["games_played", "GP", (v) => num(v, 0)],
  ["minutes_per_game", "MIN", (v) => num(v)],
  ["points_per_game", "PTS", (v) => num(v)],
  ["rebounds_per_game", "REB", (v) => num(v)],
  ["assists_per_game", "AST", (v) => num(v)],
  ["steals_per_game", "STL", (v) => num(v)],
  ["blocks_per_game", "BLK", (v) => num(v)],
  ["turnovers_per_game", "TOV", (v) => num(v)],
  ["three_pointers_made_per_game", "3PM", (v) => num(v)],
  ["true_shooting_percentage", "TS%", (v) => pct(v)],
  ["usage_percentage", "USG%", (v) => pct(v)],
  ["player_efficiency_rating", "PER", (v) => num(v)],
  ["box_plus_minus", "BPM", (v) => signed(v)],
];

function StatRow({ s }: { s: StatForecast }) {
  const isGames = s.key === "games_played";
  const d = isGames ? 0 : 1;
  const ch = s.change_from_last_season;
  return (
    <tr>
      <td>{s.label}</td>
      <td className="num">{num(s.last_season, d)}</td>
      <td className="num"><strong>{num(s.forecast, d)}</strong></td>
      <td className="num muted">{num(s.lower_80, d)} – {num(s.upper_80, d)}</td>
      <td className={`num ${ch === null ? "" : ch > 0 ? "up" : ch < 0 ? "down" : ""}`}>{signed(ch, d)}</td>
      <td className="num">{s.total_forecast === null ? "–" : int(s.total_forecast)}</td>
    </tr>
  );
}

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PlayerForecast | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api<PlayerForecast>(`/players/${encodeURIComponent(id)}`)
      .then((d) => !cancelled && setData(d))
      .catch((e: unknown) => !cancelled && setError(e instanceof ApiError ? e.message : "Something went wrong."));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <NbaShell title="Player not found">
        <div className="err">{error}</div>
        <p><Link href="/forecast/players" className="link">← Back to all players</Link></p>
      </NbaShell>
    );
  }
  if (!data) return <NbaShell title="Loading…"><p className="muted">Loading forecast…</p></NbaShell>;

  const p = data.player;
  const pts = data.stats.find((s) => s.key === "points_per_game");
  const history = [...data.history].sort((a: HistoryRow, b: HistoryRow) => Number(b.season) - Number(a.season));

  return (
    <NbaShell
      title={p.player_name}
      lede={`${[p.position, teamOf(p), p.age !== null ? `age ${num(p.age, 0)} in ${data.last_season_label}` : null]
        .filter(Boolean)
        .join(" · ")}`}
    >
      <p><Link href="/forecast/players" className="link">← All players</Link></p>

      {!p.on_roster && (
        <div className="err">Not on a {data.forecast_season_label} roster in the roster file. The forecast shows what this player would average if he played.</div>
      )}

      {pts && (
        <div className="card hero-stat">
          <div>
            <span className="muted">Forecast points per game, {data.forecast_season_label}</span>
            <div className="result">{num(pts.forecast)}</div>
            <span className="muted">80% range {num(pts.lower_80)} – {num(pts.upper_80)}</span>
          </div>
          <div>
            <span className="muted">{data.last_season_label}</span>
            <div className="result">{num(pts.last_season)}</div>
            <span className={`muted ${pts.change_from_last_season && pts.change_from_last_season > 0 ? "up" : "down"}`}>
              {signed(pts.change_from_last_season)} forecast change
            </span>
          </div>
        </div>
      )}

      <PointsChart data={data} />

      <div className="card">
        <h3>Forecast by statistic</h3>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Statistic</th>
                <th className="num">{data.last_season_label}</th>
                <th className="num">{data.forecast_season_label}</th>
                <th className="num">80% range</th>
                <th className="num">Change</th>
                <th className="num">Season total</th>
              </tr>
            </thead>
            <tbody>{data.stats.map((s) => <StatRow key={s.key} s={s} />)}</tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Past seasons</h3>
        {history.length === 0 ? (
          <p className="muted">No past seasons in the table (only seasons with 500+ minutes appear).</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>{HISTORY_COLS.map(([k, l]) => <th key={k} className={k === "main_team_name" || k === "season" ? "" : "num"}>{l}</th>)}</tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    {HISTORY_COLS.map(([k, , f]) => (
                      <td key={k} className={k === "main_team_name" || k === "season" ? "" : "num"}>{f(h[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Notes</h3>
        <ul className="plain">
          {data.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
        <p className="muted" style={{ marginTop: "0.8rem" }}>{data.model}</p>
      </div>
    </NbaShell>
  );
}
