"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NbaShell from "@/components/NbaShell";
import { api, ApiError, num, TeamSummary } from "@/lib/nba";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "ppg">("name");

  useEffect(() => {
    api<TeamSummary[]>("/teams")
      .then(setTeams)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Something went wrong."));
  }, []);

  const sorted = teams
    ? [...teams].sort((a, b) =>
        sortBy === "name"
          ? a.current_team.localeCompare(b.current_team)
          : b.average_forecast_points_per_game - a.average_forecast_points_per_game
      )
    : [];
  const max = Math.max(1, ...sorted.map((t) => t.average_forecast_points_per_game));

  return (
    <NbaShell title="Teams" lede="Teams with forecast players on their 2026-27 roster, and the average forecast points per game of those players.">
      {error && <div className="err">{error}</div>}
      {!teams && !error && <p className="muted">Loading…</p>}
      {teams && (
        <>
          <div className="form-row">
            <label>
              Sort teams by
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "ppg")}>
                <option value="name">Name</option>
                <option value="ppg">Average forecast points per game</option>
              </select>
            </label>
          </div>
          <div className="grid-cards">
            {sorted.map((t) => (
              <Link key={t.current_team} href={`/forecast/players?team=${encodeURIComponent(t.current_team)}`} className="link-card">
                <strong>{t.current_team}</strong>
                <span className="muted">{t.forecast_players} forecast players</span>
                <div className="meter"><div style={{ width: `${(t.average_forecast_points_per_game / max) * 100}%` }} /></div>
                <span>{num(t.average_forecast_points_per_game, 2)} avg PPG</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </NbaShell>
  );
}
