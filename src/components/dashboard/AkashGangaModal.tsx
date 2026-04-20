import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { TowerProgress } from "@/types/api";
import "./akash-ganga.css";

interface Props {
  open: boolean;
  onClose: () => void;
  tower: TowerProgress | null;
  projectName?: string;
  projectId: string;
}

export function AkashGangaModal({
  open,
  onClose,
  tower,
  projectName,
  projectId,
}: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!tower) return null;

  const pct = Math.round(tower.completion_pct);
  const phase = phaseLabel(pct);
  const badge = badgeLetter(tower.building_name);

  return (
    <div
      className={`ag-scope ag-modal-backdrop${open ? " ag-open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ag-modal">
        <button
          type="button"
          className="ag-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="ag-modal-snap">
          <div className="ag-snap-tag">Snapshot · {badge}-{tower.building_id.slice(0, 4).toUpperCase()}</div>
          <TowerSnapshotSvg />
          <div className="ag-snap-meta">
            <div>
              <b>{tower.building_name}</b>
              {projectName ?? "Project"} · {tower.floors.length} floors
            </div>
            <div>
              {pct}% · {phase}
            </div>
          </div>
        </div>

        <div className="ag-modal-body">
          <div className="ag-modal-kicker">Tower Transit · Resolved</div>
          <div className="ag-modal-title">{tower.building_name}</div>
          <div className="ag-modal-sub">
            {projectName ? (
              <>
                Part of <b>{projectName}</b>.{" "}
              </>
            ) : null}
            Currently at <b>{pct}% inspected</b> across {tower.floors.length} floors
            and {tower.total_flats} flats.
          </div>

          <div className="ag-modal-grid">
            <Cell k="Total Flats" v={tower.total_flats} />
            <Cell k="Inspected" v={tower.inspected_flats} />
            <Cell k="In Progress" v={tower.in_progress_flats} />
            <Cell k="Pending" v={tower.not_started_flats} />
            <Cell k="Completion" v={pct} unit="%" />
            <Cell k="Floors" v={tower.floors.length} />
          </div>

          <div className="ag-sev-row">
            <span className="ag-sev">
              <span
                className="ag-sev-dot"
                style={{ background: "#dc2626" }}
              />
              <b>{tower.critical_snags}</b> critical
            </span>
            <span className="ag-sev">
              <span
                className="ag-sev-dot"
                style={{ background: "#f59e0b" }}
              />
              <b>{tower.major_snags}</b> major
            </span>
            <span className="ag-sev">
              <span
                className="ag-sev-dot"
                style={{ background: "#9ca3af" }}
              />
              <b>{tower.minor_snags}</b> minor
            </span>
            <span style={{ marginLeft: "auto" }}>
              <b style={{ color: "var(--ag-ink)", fontFamily: "'Zen Old Mincho', serif", fontSize: 14 }}>
                {tower.open_snags}
              </b>{" "}
              open
            </span>
          </div>

          <div className="ag-modal-actions">
            <button
              type="button"
              className="ag-btn ag-primary"
              onClick={() => {
                onClose();
                navigate(`/projects/${projectId}/buildings/${tower.building_id}`);
              }}
            >
              Open tower page
            </button>
            <button type="button" className="ag-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ k, v, unit }: { k: string; v: number; unit?: string }) {
  return (
    <div className="ag-cell">
      <div className="ag-k">{k}</div>
      <div className="ag-v">
        {v}
        {unit ? <small>{unit}</small> : null}
      </div>
    </div>
  );
}

function phaseLabel(pct: number): string {
  if (pct >= 95) return "Handover ready";
  if (pct >= 60) return "Final snagging";
  if (pct >= 25) return "Active inspection";
  if (pct > 0) return "Early inspection";
  return "Pre-inspection";
}

function badgeLetter(name: string): string {
  const m = name.match(/[A-Za-z]/g);
  return (m ? m[m.length - 1] : name.charAt(0)).toUpperCase();
}

function TowerSnapshotSvg() {
  return (
    <svg
      className="ag-snap-img"
      viewBox="0 0 600 520"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="agMSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6eff5" />
          <stop offset="0.55" stopColor="#f3ead9" />
          <stop offset="1" stopColor="#f7d9c2" />
        </linearGradient>
        <linearGradient id="agMGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a6c4d4" />
          <stop offset="1" stopColor="#6a8697" />
        </linearGradient>
        <linearGradient id="agMWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9ddea" />
          <stop offset="1" stopColor="#8cb0c6" />
        </linearGradient>
      </defs>
      <rect width="600" height="520" fill="url(#agMSky)" />
      <circle cx="450" cy="160" r="44" fill="#f4c9a6" opacity="0.7" />
      <circle cx="450" cy="160" r="62" fill="#f4c9a6" opacity="0.25" />
      <path
        d="M 0 340 Q 120 300 240 320 T 480 318 T 600 330 L 600 380 L 0 380 Z"
        fill="#b7c8cf"
        opacity="0.75"
      />
      <path
        d="M 0 360 Q 150 330 300 350 T 600 358 L 600 400 L 0 400 Z"
        fill="#8fa6af"
        opacity="0.85"
      />
      <g opacity="0.7">
        <rect x="60" y="260" width="60" height="140" fill="#3a4a58" />
        <rect x="130" y="240" width="48" height="160" fill="#475866" />
        <rect x="440" y="270" width="54" height="130" fill="#3a4a58" />
        <rect x="500" y="250" width="46" height="150" fill="#475866" />
      </g>
      <g transform="translate(300 0)">
        <rect x="-90" y="380" width="180" height="20" fill="#1b2430" />
        <rect
          x="-70"
          y="200"
          width="140"
          height="200"
          fill="#2a3a4a"
          stroke="#1b2430"
          strokeWidth="1"
        />
        <rect
          x="-56"
          y="140"
          width="112"
          height="260"
          fill="url(#agMGlass)"
          stroke="#1b2430"
          strokeWidth="1"
        />
        <rect
          x="-40"
          y="90"
          width="80"
          height="310"
          fill="#3d5565"
          stroke="#1b2430"
          strokeWidth="1"
        />
        <rect
          x="-24"
          y="50"
          width="48"
          height="350"
          fill="#4a6476"
          stroke="#1b2430"
          strokeWidth="1"
        />
        <g stroke="#1b2430" strokeOpacity="0.2" strokeWidth="0.5">
          <line x1="-56" y1="160" x2="56" y2="160" />
          <line x1="-56" y1="180" x2="56" y2="180" />
          <line x1="-56" y1="200" x2="56" y2="200" />
          <line x1="-56" y1="220" x2="56" y2="220" />
          <line x1="-56" y1="240" x2="56" y2="240" />
          <line x1="-56" y1="260" x2="56" y2="260" />
          <line x1="-56" y1="280" x2="56" y2="280" />
          <line x1="-56" y1="300" x2="56" y2="300" />
          <line x1="-56" y1="320" x2="56" y2="320" />
          <line x1="-56" y1="340" x2="56" y2="340" />
          <line x1="-56" y1="360" x2="56" y2="360" />
        </g>
        <g fill="#ffd79a" opacity="0.8">
          <rect x="-48" y="152" width="4" height="5" />
          <rect x="-30" y="152" width="4" height="5" />
          <rect x="10" y="152" width="4" height="5" />
          <rect x="34" y="152" width="4" height="5" />
          <rect x="-40" y="180" width="4" height="5" />
          <rect x="20" y="180" width="4" height="5" />
          <rect x="-48" y="210" width="4" height="5" />
          <rect x="-20" y="210" width="4" height="5" />
          <rect x="30" y="210" width="4" height="5" />
          <rect x="-30" y="240" width="4" height="5" />
          <rect x="10" y="240" width="4" height="5" />
          <rect x="40" y="240" width="4" height="5" />
          <rect x="-48" y="270" width="4" height="5" />
          <rect x="0" y="270" width="4" height="5" />
          <rect x="30" y="270" width="4" height="5" />
          <rect x="-20" y="300" width="4" height="5" />
          <rect x="20" y="300" width="4" height="5" />
          <rect x="-40" y="330" width="4" height="5" />
          <rect x="10" y="330" width="4" height="5" />
          <rect x="-20" y="360" width="4" height="5" />
        </g>
        <line x1="0" y1="50" x2="0" y2="20" stroke="#1b2430" strokeWidth="1.5" />
        <circle cx="0" cy="18" r="2.5" fill="#1b2430" />
      </g>
      <rect y="400" width="600" height="120" fill="url(#agMWater)" />
      <g
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="0.7"
        fill="none"
      >
        <path d="M 50 430 Q 150 426 250 430 T 450 430 T 600 432" />
        <path d="M 0 460 Q 100 456 200 460 T 400 460 T 600 462" />
        <path d="M 80 490 Q 180 486 280 490 T 480 490 T 600 492" />
      </g>
    </svg>
  );
}
