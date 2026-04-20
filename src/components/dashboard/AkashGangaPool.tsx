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
          <CausticsSvg variant="a" />
          <CausticsSvg variant="b" />
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

function CausticsSvg({ variant }: { variant: "a" | "b" }) {
  const isA = variant === "a";
  const filterId = isA ? "ag-turb-a" : "ag-turb-b";
  const maskId = isA ? "ag-mask-a" : "ag-mask-b";
  const gradId = "ag-pool-grad";
  const baseFreq = isA ? 0.018 : 0.035;
  const freqValues = isA ? "0.018;0.022;0.018" : "0.035;0.040;0.032;0.035";
  const dur = isA ? "18s" : "24s";
  const seed = isA ? 4 : 11;
  const matrix = isA
    ? "0 0 0 0 0.22  0 0 0 0 0.78  0 0 0 0 0.95  0 0 0 22 -9"
    : "0 0 0 0 0.15  0 0 0 0 0.62  0 0 0 0 0.86  0 0 0 18 -7";
  const blur = isA ? 0.6 : 0.4;

  return (
    <svg
      className={`ag-caustics ag-${variant}`}
      viewBox="0 0 300 300"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFreq}
            numOctaves={2}
            seed={seed}
          >
            <animate
              attributeName="baseFrequency"
              dur={dur}
              values={freqValues}
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix type="matrix" values={matrix} />
          <feGaussianBlur stdDeviation={blur} />
        </filter>
        {isA ? (
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.72" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        ) : null}
        <mask id={maskId}>
          <rect width="300" height="300" fill={`url(#${gradId})`} />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        {isA ? <rect width="300" height="300" fill="#ffffff" /> : null}
        <rect width="300" height="300" filter={`url(#${filterId})`} />
      </g>
    </svg>
  );
}
