import { useEffect, useState } from "react";

import { DashboardPage } from "../pages/DashboardPage";
import { DesignPlaygroundPage } from "../pages/DesignPlaygroundPage";
import { ProgressEntryPage } from "../pages/ProgressEntryPage";

type AppRoute = "progress-entry" | "dashboard" | "design-playground";

const PLAYGROUND_PATHS = new Set(["/design-playground", "/playground"]);
const DASHBOARD_PATHS = new Set(["/dashboard"]);

function resolveRoute(pathname: string): AppRoute {
  if (PLAYGROUND_PATHS.has(pathname)) {
    return "design-playground";
  }

  if (DASHBOARD_PATHS.has(pathname)) {
    return "dashboard";
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

  return <ProgressEntryPage onNavigate={navigate} />;
}
