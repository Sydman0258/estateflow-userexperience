"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import NbaShell from "@/components/NbaShell";
import { api, ApiError, num, prettyHeader, Row } from "@/lib/nba";

interface ModelResult {
  model: string;
  label: string;
  rmse: number | null;
  rmse_ci_low: number | null;
  rmse_ci_high: number | null;
  mae: number | null;
  bias: number | null;
  r_squared: number | null;
  skill_vs_naive: number | null;
}
interface Comparison {
  rmse_difference: number | null;
  ci_low: number | null;
  ci_high: number | null;
  verdict: string | null;
}
interface TargetResult {
  target: string;
  key: string;
  label: string;
  unit: string;
  models: ModelResult[];
  xgboost_vs_naive?: Comparison;
  xgboost_vs_compact_ols?: Comparison;
  xgboost_vs_ridge?: Comparison;
}
interface Headline {
  targets: number;
  xgboost_clearly_better_than_naive: number;
  xgboost_vs_linear_regression_clear_differences: number;
  summary: string;
}
interface Evaluation {
  protocol: string;
  dataset: Record<string, Record<string, number>>;
  headline: Headline | null;
  test_results: TargetResult[];
  season_totals: Row[] | null;
  points_per_game: {
    segments: Row[] | null;
    calibration: { deciles: Row[]; slope: number | null; intercept: number | null } | null;
    interval_coverage: Row[] | null;
    permutation_importance: { groups: Row[]; top_inputs: Row[] } | null;
  };
  validation_results: Row[] | null;
  ensemble_experiment: Row[] | null;
  limitations: string[];
}

const ORDER = ["naive_last_season", "compact_ols", "ridge", "xgboost"];
const SHORT: Record<string, string> = {
  naive_last_season: "Naive",
  compact_ols: "OLS",
  ridge: "Ridge",
  xgboost: "XGBoost",
};

function verdictClass(v: string | null | undefined) {
  if (!v) return "badge";
  if (v.includes("better")) return "badge badge-good";
  if (v.includes("worse")) return "badge badge-bad";
  return "badge";
}

function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="card">
      <summary><h3 style={{ display: "inline", margin: 0 }}>{title}</h3></summary>
      <div style={{ marginTop: "1rem" }}>{children}</div>
    </details>
  );
}

export default function EvaluationPage() {
  const [ev, setEv] = useState<Evaluation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Evaluation>("/evaluation")
      .then(setEv)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Something went wrong."));
  }, []);

  const splitRows: Row[] = ev
    ? Object.keys(ev.dataset ?? {}).map((split) => ({ split, ...ev.dataset[split] }))
    : [];

  return (
    <NbaShell
      title="Evaluation"
      lede="How the model did on seasons it never saw. RMSE is the typical size of an error in each statistic's own units (lower is better)."
    >
      {error && <div className="err">{error}</div>}
      {!ev && !error && <p className="muted">Loading…</p>}

      {ev && (
        <>
          {ev.headline && (
            <div className="card">
              <div className="metrics-grid">
                <div className="metric"><strong>{ev.headline.targets}</strong><span>statistics forecast</span></div>
                <div className="metric">
                  <strong>{ev.headline.xgboost_clearly_better_than_naive}/{ev.headline.targets}</strong>
                  <span>clearly beat repeating last season</span>
                </div>
                <div className="metric">
                  <strong>{ev.headline.targets - ev.headline.xgboost_vs_linear_regression_clear_differences}/{ev.headline.targets}</strong>
                  <span>indistinguishable from linear regression</span>
                </div>
              </div>
              <p style={{ marginTop: "1rem" }}>{ev.headline.summary}</p>
            </div>
          )}

          <div className="card">
            <h3>Test-season accuracy by statistic</h3>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Statistic</th>
                    {ORDER.map((m) => <th key={m} className="num">{SHORT[m]} RMSE</th>)}
                    <th className="num">Skill vs naive</th>
                    <th>XGBoost vs naive</th>
                  </tr>
                </thead>
                <tbody>
                  {ev.test_results.map((t) => {
                    const by = Object.fromEntries(t.models.map((m) => [m.model, m]));
                    const best = Math.min(...t.models.map((m) => m.rmse ?? Infinity));
                    return (
                      <tr key={t.target}>
                        <td>{t.label}<br /><span className="muted" style={{ fontSize: "0.85rem" }}>{t.unit}</span></td>
                        {ORDER.map((m) => (
                          <td key={m} className="num" style={by[m]?.rmse === best ? { fontWeight: 800 } : undefined}>
                            {num(by[m]?.rmse, 3)}
                          </td>
                        ))}
                        <td className="num">
                          {by.xgboost?.skill_vs_naive === null || by.xgboost?.skill_vs_naive === undefined
                            ? "–"
                            : `${num(by.xgboost.skill_vs_naive * 100)}%`}
                        </td>
                        <td><span className={verdictClass(t.xgboost_vs_naive?.verdict)}>{t.xgboost_vs_naive?.verdict ?? "–"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>
              Bold = lowest error. Skill vs naive is the share of the naive error removed (7% means 7% smaller). Intervals resample whole players.
            </p>
          </div>

          <Details title="Full model comparison (MAE, bias, R², error ranges)">
            {ev.test_results.map((t) => (
              <div key={t.target} style={{ marginBottom: "1.4rem" }}>
                <p className="eval-h">{t.label}</p>
                <DataTable
                  rows={t.models.map((m) => ({
                    model: m.label,
                    rmse: m.rmse,
                    rmse_low: m.rmse_ci_low,
                    rmse_high: m.rmse_ci_high,
                    mae: m.mae,
                    bias: m.bias,
                    r_squared: m.r_squared,
                    skill_vs_naive: m.skill_vs_naive,
                  }))}
                />
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  {[
                    ["vs naive", t.xgboost_vs_naive],
                    ["vs OLS", t.xgboost_vs_compact_ols],
                    ["vs ridge", t.xgboost_vs_ridge],
                  ]
                    .map(([name, c]) => {
                      const cmp = c as Comparison | undefined;
                      return cmp ? `${name}: ${cmp.verdict ?? "–"} (RMSE ${num(cmp.rmse_difference, 3)})` : null;
                    })
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </Details>

          <div className="card">
            <h3>Validation protocol</h3>
            <p>{ev.protocol}</p>
            {splitRows.length > 0 && <div style={{ marginTop: "1rem" }}><DataTable rows={splitRows} /></div>}
          </div>

          {ev.season_totals && (
            <Details title="Season totals">
              <DataTable rows={ev.season_totals} hide={["target"]} />
            </Details>
          )}

          <Details title="Points per game: deep dive">
            {ev.points_per_game.calibration && (
              <>
                <p className="eval-h">Calibration</p>
                <p className="muted">
                  Slope {num(ev.points_per_game.calibration.slope, 3)}, intercept {num(ev.points_per_game.calibration.intercept, 3)} (a slope of 1 and intercept of 0 is perfect).
                </p>
                <DataTable rows={ev.points_per_game.calibration.deciles} />
              </>
            )}
            {ev.points_per_game.interval_coverage && (
              <>
                <p className="eval-h">80% interval coverage</p>
                <DataTable rows={ev.points_per_game.interval_coverage} />
              </>
            )}
            {ev.points_per_game.segments && (
              <>
                <p className="eval-h">Accuracy by segment</p>
                <DataTable rows={ev.points_per_game.segments} />
              </>
            )}
            {ev.points_per_game.permutation_importance && (
              <>
                <p className="eval-h">What the model relies on (permutation importance)</p>
                <DataTable rows={ev.points_per_game.permutation_importance.groups} />
                <p className="eval-h">Top single inputs</p>
                <DataTable rows={ev.points_per_game.permutation_importance.top_inputs} />
              </>
            )}
          </Details>

          {ev.validation_results && (
            <Details title="Validation seasons (used for tuning)">
              <DataTable rows={ev.validation_results} hide={["target"]} />
            </Details>
          )}
          {ev.ensemble_experiment && (
            <Details title="Ensemble experiment">
              <DataTable rows={ev.ensemble_experiment} hide={["target"]} />
            </Details>
          )}

          <div className="card">
            <h3>Limitations</h3>
            <ul className="plain">{ev.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
        </>
      )}
    </NbaShell>
  );
}
