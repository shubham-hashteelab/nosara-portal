import { useState } from "react";
import type { RefObject } from "react";
import "./akash-ganga.css";

interface Props {
  poolRef: RefObject<HTMLDivElement | null>;
  armed: boolean;
  dragging: boolean;
}

export function AkashGangaPool({ poolRef, armed, dragging }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className={`ag-scope ag-pool-card ag-collapsed${armed ? " ag-armed" : ""}`}>
        <button
          type="button"
          className="ag-brand-mini"
          onClick={() => setCollapsed(false)}
          title="Open Akash Ganga"
        >
          <span className="ag-brand-mark" />
        </button>
      </div>
    );
  }

  const label = dragging
    ? armed
      ? "Still water · release to touch"
      : "Approach the pool…"
    : "Awaiting asset · drop to reflect";

  return (
    <div className={`ag-scope ag-pool-card${armed ? " ag-armed" : ""}`}>
      <div className="ag-head">
        <div className="ag-title">
          Akash Ganga
        </div>
        <div className="ag-status">
          <span className="ag-dot" />
          {armed ? "Armed" : "Still"}
          <button
            type="button"
            className="ag-toggle-btn"
            onClick={() => setCollapsed(true)}
            title="Minimize"
            aria-label="Minimize Akash Ganga"
          >
            −
          </button>
        </div>
      </div>
      <div className="ag-pool-wrap">
        <div ref={poolRef} className="ag-pool">
          <div className="ag-ring-static ag-s1" />
          <div className="ag-ring-static ag-s2" />
          <div className="ag-ring-static ag-s3" />
          <div className="ag-hole" />
          <div className="ag-glint" />
          <div className="ag-ripple ag-r1" />
          <div className="ag-ripple ag-r2" />
          <div className="ag-ripple ag-r3" />
          <div className="ag-drop-ring" />
          <div className="ag-drop-ring" />
        </div>
      </div>
      <div className="ag-foot">
        <span>◦</span>
        <span className="ag-label">{label}</span>
        <span>◦</span>
      </div>
    </div>
  );
}
