import { useEffect, useState } from "react";

import { DashboardPage } from "../pages/DashboardPage";
import { DesignPlaygroundPage } from "../pages/DesignPlaygroundPage";
import { MapsPage } from "../pages/MapsPage";
import { ProgressEntryPage } from "../pages/ProgressEntryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { StatsPage } from "../pages/StatsPage";

type AppRoute = "progress-entry" | "dashboard" | "design-playground" | "maps" | "settings" | "stats";

const PLAYGROUND_PATHS = new Set(["/design-playground", "/playground"]);
const DASHBOARD_PATHS = new Set(["/dashboard"]);
const MAPS_PATHS = new Set(["/maps"]);
const SETTINGS_PATHS = new Set(["/settings"]);
const STATS_PATHS = new Set(["/stats"]);

function resolveRoute(pathname: string): AppRoute {
  if (PLAYGROUND_PATHS.has(pathname)) {
    return "design-playground";
  }

  if (DASHBOARD_PATHS.has(pathname)) {
    return "dashboard";
  }

  if (MAPS_PATHS.has(pathname)) {
    return "maps";
  }

  if (SETTINGS_PATHS.has(pathname)) {
    return "settings";
  }

  if (STATS_PATHS.has(pathname)) {
    return "stats";
  }

  return "progress-entry";
}

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function navigate(nextPath: string) {
    if (window.location.pathname === nextPath) {
      return;
    }

    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
  }

  const route = resolveRoute(pathname);

  if (route === "design-playground") {
    return <DesignPlaygroundPage onNavigate={navigate} />;
  }

  if (route === "dashboard") {
    return <DashboardPage onNavigate={navigate} />;
  }

  if (route === "maps") {
    return <MapsPage onNavigate={navigate} />;
  }

  if (route === "settings") {
    return <SettingsPage onNavigate={navigate} />;
  }

  if (route === "stats") {
    return <StatsPage onNavigate={navigate} />;
  }

  return <ProgressEntryPage onNavigate={navigate} />;
}
