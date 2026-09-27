"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { ConsensusCluster } from "@/components/forum/ConsensusCluster";
import { broadAgreement, progress, type CountRow } from "@/lib/forum/consensus";

type State = { status: "loading" } | { status: "error" } | { status: "ready"; rows: CountRow[] };

/** Loads live vote counts and shows where language groups agree. */
export function ForumResults() {
  const t = useTranslations("Forum.consensus");
  const [state, setState] = React.useState<State>({ status: "loading" });

  React.useEffect(() => {
    let live = true;
    fetch("/api/forum/results")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { rows: CountRow[] }) => live && setState({ status: "ready", rows: data.rows }))
      .catch(() => live && setState({ status: "error" }));
    return () => {
      live = false;
    };
  }, []);

  if (state.status !== "ready") {
    return (
      <p role="status" data-testid="results-status" className="depth-card p-6 text-base sm:p-8">
        {t(state.status === "loading" ? "loading" : "error")}
      </p>
    );
  }
  return <ConsensusCluster items={broadAgreement(state.rows)} progress={progress(state.rows)} />;
}
