import { useEffect, useState } from "react";

import { DashboardPage } from "../pages/DashboardPage";
import { DesignPlaygroundPage } from "../pages/DesignPlaygroundPage";

type AppRoute = "dashboard" | "design-playground";

const PLAYGROUND_PATHS = new Set(["/design-playground", "/playground"]);

function resolveRoute(pathname: string): AppRoute {
  return PLAYGROUND_PATHS.has(pathname) ? "design-playground" : "dashboard";
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

  return <DashboardPage onNavigate={navigate} />;
}
