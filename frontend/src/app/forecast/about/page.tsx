"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import NbaShell from "@/components/NbaShell";
import { api, ApiError, Health, int, Row } from "@/lib/nba";

interface About {
  title: string;
  goal: string;
  forecast_season: string;
  based_on_season: string;
  population: string;
  model: string;
  validation: string;
  data: { player_statistics: string; roster: string; citation: string[] };
  limitations: string[];
}

export default function AboutPage() {
  const [about, setAbout] = useState<About | null>(null);
  const [columns, setColumns] = useState<Row[] | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api<About>("/about")
      .then(setAbout)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Something went wrong."));
    api<Row[]>("/columns").then(setColumns).catch(() => undefined);
    api<Health>("/health").then(setHealth).catch(() => undefined);
  }, []);

  const shownColumns = useMemo(() => {
    if (!columns) return null;
    const f = filter.trim().toLowerCase();
    if (!f) return columns;
    return columns.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(f)));
  }, [columns, filter]);

  return (
    <NbaShell title="Method" lede="What the forecast is, where the data comes from, how it was validated, and what it cannot do.">
      {error && <div className="err">{error}</div>}
      {!about && !error && <p className="muted">Loading…</p>}

      {about && (
        <>
          <div className="card">
            <h3>{about.title}</h3>
            <p>{about.goal}</p>
            <div className="metrics-grid" style={{ marginTop: "1rem" }}>
              <div className="metric"><strong>{about.forecast_season}</strong><span>season forecast</span></div>
              <div className="metric"><strong>{about.based_on_season}</strong><span>latest season used</span></div>
              {health && <div className="metric"><strong>{int(health.forecast_players)}</strong><span>players forecast</span></div>}
              {health && <div className="metric"><strong>{int(health.final_table_rows)}</strong><span>player-seasons in table</span></div>}
            </div>
          </div>

          <div className="card">
            <h3>Who is forecast</h3>
            <p>{about.population}</p>
          </div>
          <div className="card">
            <h3>Model</h3>
            <p>{about.model}</p>
          </div>
          <div className="card">
            <h3>Validation</h3>
            <p>{about.validation}</p>
          </div>
          <div className="card">
            <h3>Data sources</h3>
            <p><strong>Statistics.</strong> {about.data.player_statistics}</p>
            <p style={{ marginTop: "0.6rem" }}><strong>Rosters.</strong> {about.data.roster}</p>
            <p className="eval-h">Citations</p>
            <ul className="plain">{about.data.citation.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
          <div className="card">
            <h3>Limitations</h3>
            <ul className="plain">{about.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
        </>
      )}

      {columns && (
        <details className="card">
          <summary><h3 style={{ display: "inline", margin: 0 }}>Column dictionary ({columns.length})</h3></summary>
          <div className="form-row" style={{ marginTop: "1rem" }}>
            <label>
              Filter
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="e.g. usage" />
            </label>
          </div>
          <DataTable rows={shownColumns} />
        </details>
      )}
    </NbaShell>
  );
}
