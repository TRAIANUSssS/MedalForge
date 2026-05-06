import { useEffect, useState } from "react";

import { getHealth, type HealthResponse } from "../api/client";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; data: HealthResponse }
  | { status: "error"; message: string };

const navItems = ["Dashboard", "Maps", "Stats", "Charts", "Settings"];

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth({ status: "ok", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unknown backend error";
          setHealth({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">MF</span>
          <div>
            <h1>MedalForge</h1>
            <p>Warrior medals dashboard</p>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button className={item === "Dashboard" ? "active" : ""} key={item} type="button">
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <section className="page-header">
          <div>
            <p className="eyebrow">Sprint 1</p>
            <h2>Core project shell</h2>
            <p>
              Backend, SQLite initialization, and frontend health check are wired. Data sync and
              maps table come next.
            </p>
          </div>
          <HealthBadge health={health} />
        </section>

        <section className="summary-grid" aria-label="MVP progress placeholders">
          <MetricCard label="Warrior maps" value="0" detail="Waiting for first sync" />
          <MetricCard label="Earned medals" value="0" detail="PB sync not configured yet" />
          <MetricCard label="Close medals" value="0" detail="Needs player records" />
          <MetricCard label="Snapshots" value="0" detail="Created after PB sync" />
        </section>

        <section className="content-panel">
          <div>
            <h3>Next implementation target</h3>
            <p>
              Sprint 2 will add Warrior data sync, raw JSON caching, SQLite upsert, and the first
              real maps API.
            </p>
          </div>
          <div className="task-list">
            <span>POST /api/sync/warrior-data</span>
            <span>GET /api/maps</span>
            <span>Maps table UI</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function HealthBadge({ health }: { health: HealthState }) {
  if (health.status === "loading") {
    return <div className="health-badge loading">Checking backend</div>;
  }

  if (health.status === "error") {
    return <div className="health-badge error">Backend offline</div>;
  }

  return <div className="health-badge ok">Backend {health.data.version}</div>;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}
