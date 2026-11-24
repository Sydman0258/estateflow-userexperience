"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import NbaShell from "@/components/NbaShell";
import {
  api, ApiError, int, num, PER_GAME_STATS, PlayerList, POSITIONS, TeamSummary, teamOf, TOTAL_STATS,
} from "@/lib/nba";
import { useDebounce } from "@/lib/useDebounce";

const LIMIT = 25;

const SORT_OPTIONS: [string, string][] = [
  ["player_name", "Name"],
  ["age", "Age"],
  ["last_points_per_game", "Last season points per game"],
  ...PER_GAME_STATS.map(([k, l]) => [`forecast_${k}`, `Forecast: ${l}`] as [string, string]),
  ...TOTAL_STATS.map(([k, l]) => [`forecast_${k}`, `Forecast: ${l}`] as [string, string]),
];

function PlayersContent() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [team, setTeam] = useState(params.get("team") || "");
  const [position, setPosition] = useState("");
  const [roster, setRoster] = useState<"all" | "yes" | "no">("yes");
  const [sort, setSort] = useState("forecast_points_per_game");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [data, setData] = useState<PlayerList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const dq = useDebounce(q, 300);

  useEffect(() => {
    api<TeamSummary[]>("/teams").then(setTeams).catch(() => undefined);
  }, []);

  useEffect(() => setPage(0), [dq, team, position, roster, sort, order]);

  useEffect(() => {
    const qs = new URLSearchParams({
      sort, order, limit: String(LIMIT), offset: String(page * LIMIT),
    });
    if (dq.trim()) qs.set("q", dq.trim());
    if (team) qs.set("team", team);
    if (position) qs.set("position", position);
    if (roster !== "all") qs.set("on_roster", roster === "yes" ? "true" : "false");
    let cancelled = false;
    setLoading(true);
    api<PlayerList>(`/players?${qs}`)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError("");
        }
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof ApiError ? e.message : "Something went wrong."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dq, team, position, roster, sort, order, page]);

  function sortBy(key: string) {
    if (sort === key) setOrder(order === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setOrder(key === "player_name" ? "asc" : "desc");
    }
  }

  const arrow = (key: string) => (sort === key ? (order === "desc" ? " ▼" : " ▲") : "");
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <NbaShell title="Players" lede="Search every forecast player. Click a column to sort, click a name for the full forecast.">
      <div className="card">
        <div className="form-row">
          <label>
            Search name
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. doncic" />
          </label>
          <label>
            Team
            <select value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t.current_team} value={t.current_team}>{t.current_team}</option>
              ))}
            </select>
          </label>
          <label>
            Position
            <select value={position} onChange={(e) => setPosition(e.target.value)}>
              <option value="">All positions</option>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label>
            Roster
            <select value={roster} onChange={(e) => setRoster(e.target.value as "all" | "yes" | "no")}>
              <option value="yes">On a 2026-27 roster</option>
              <option value="no">Not on a roster</option>
              <option value="all">Everyone</option>
            </select>
          </label>
          <label>
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
        <p className="muted">
          {loading ? "Loading…" : data ? `${data.total.toLocaleString("en-US")} players match` : ""}
        </p>
      </div>

      {error && <div className="err">{error}</div>}

      {data && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => sortBy("player_name")}>Player{arrow("player_name")}</th>
                  <th>Team</th>
                  <th>Pos</th>
                  <th className="sortable num" onClick={() => sortBy("age")}>Age{arrow("age")}</th>
                  <th className="sortable num" onClick={() => sortBy("last_points_per_game")}>Last PPG{arrow("last_points_per_game")}</th>
                  <th className="sortable num" onClick={() => sortBy("forecast_points_per_game")}>Forecast PPG{arrow("forecast_points_per_game")}</th>
                  <th className="num">80% range</th>
                  <th className="sortable num" onClick={() => sortBy("forecast_games_played")}>Games{arrow("forecast_games_played")}</th>
                  <th className="sortable num" onClick={() => sortBy("forecast_total_points")}>Total pts{arrow("forecast_total_points")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.player_identifier}>
                    <td>
                      <Link href={`/forecast/players/${p.player_identifier}`} className="link">{p.player_name}</Link>
                      {!p.on_roster && <span className="badge badge-warn">no roster</span>}
                    </td>
                    <td>{teamOf(p)}</td>
                    <td>{p.position || "–"}</td>
                    <td className="num">{num(p.age, 0)}</td>
                    <td className="num">{num(p.last_season_points_per_game)}</td>
                    <td className="num"><strong>{num(p.forecast_points_per_game)}</strong></td>
                    <td className="num muted">
                      {num(p.forecast_points_per_game_80_percent_lower)} – {num(p.forecast_points_per_game_80_percent_upper)}
                    </td>
                    <td className="num">{num(p.forecast_games_played, 0)}</td>
                    <td className="num">{int(p.forecast_total_points)}</td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan={9} className="muted">No players match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button>
            <span className="muted">Page {page + 1} of {pages}</span>
            <button className="btn" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        </div>
      )}
    </NbaShell>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<NbaShell title="Players"><p className="muted">Loading…</p></NbaShell>}>
      <PlayersContent />
    </Suspense>
  );
}
