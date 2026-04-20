import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { TowerProgress } from "@/types/api";

type PointerCb = (e: ReactPointerEvent<HTMLElement>) => void;

const DRAG_THRESHOLD_PX = 6;
const SUCK_DURATION_MS = 820;

interface DragState {
  tower: TowerProgress;
  origin: HTMLElement;
  ghost: HTMLElement;
  offX: number;
  offY: number;
  w: number;
  h: number;
  startLeft: number;
  startTop: number;
  startX: number;
  startY: number;
  crossedThreshold: boolean;
}

export interface AkashGangaDragApi {
  poolRef: RefObject<HTMLDivElement | null>;
  armed: boolean;
  draggingTowerId: string | null;
  getDragHandlers: (tower: TowerProgress) => {
    onPointerDown: PointerCb;
    suppressClick: () => boolean;
  };
}

export function useAkashGangaDrag(options: {
  onDrop: (tower: TowerProgress) => void;
  onSound?: () => void;
}): AkashGangaDragApi {
  const poolRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<DragState | null>(null);
  const [armed, setArmed] = useState(false);
  const [draggingTowerId, setDraggingTowerId] = useState<string | null>(null);
  const justDraggedRef = useRef(false);

  const getPoolCenter = useCallback(() => {
    const el = poolRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
  }, []);

  const cleanup = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (s.ghost.parentNode) s.ghost.parentNode.removeChild(s.ghost);
    s.origin.style.visibility = "";
    stateRef.current = null;
    setArmed(false);
    setDraggingTowerId(null);
  }, []);

  const beginActualDrag = useCallback(
    (s: DragState) => {
      const clone = s.origin.cloneNode(true) as HTMLElement;
      clone.classList.add("ag-drag-ghost");
      clone.style.transition = "none";
      clone.style.left = s.startLeft + "px";
      clone.style.top = s.startTop + "px";
      clone.style.width = s.w + "px";
      clone.style.height = s.h + "px";
      clone.style.margin = "0";
      document.body.appendChild(clone);
      s.ghost = clone;
      s.origin.style.visibility = "hidden";
      setDraggingTowerId(s.tower.building_id);
    },
    []
  );

  const handleMove = useCallback(
    (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const cx = e.clientX;
      const cy = e.clientY;

      if (!s.crossedThreshold) {
        const dx = cx - s.startX;
        const dy = cy - s.startY;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          s.crossedThreshold = true;
          justDraggedRef.current = true;
          beginActualDrag(s);
        } else {
          return;
        }
      }

      const tx = cx - s.offX;
      const ty = cy - s.offY;
      s.ghost.style.left = tx + "px";
      s.ghost.style.top = ty + "px";

      const vc = getPoolCenter();
      let isArmed = false;
      if (vc) {
        const cardCx = tx + s.w / 2;
        const cardCy = ty + s.h / 2;
        const dist = Math.hypot(cardCx - vc.x, cardCy - vc.y);
        isArmed = dist < vc.r * 1.2;
      }
      setArmed(isArmed);
    },
    [beginActualDrag, getPoolCenter]
  );

  const suckIn = useCallback(
    (s: DragState, vc: { x: number; y: number; r: number }) => {
      s.ghost.classList.add("ag-sucked");
      s.ghost.style.left = vc.x - s.w / 2 + "px";
      s.ghost.style.top = vc.y - s.h / 2 + "px";
      s.ghost.style.transform = "scale(0.02) rotate(-10deg)";
      s.ghost.style.opacity = "0";
      options.onSound?.();
      const pool = poolRef.current;
      if (pool) {
        pool
          .querySelectorAll<HTMLElement>(".ag-drop-ring")
          .forEach((ring, i) => {
            ring.classList.remove("ag-go");
            void ring.offsetWidth;
            setTimeout(() => ring.classList.add("ag-go"), i === 0 ? 0 : 180);
          });
      }
      setTimeout(() => {
        options.onDrop(s.tower);
        cleanup();
      }, SUCK_DURATION_MS);
    },
    [cleanup, options]
  );

  const cancelDrag = useCallback(
    (s: DragState) => {
      s.ghost.style.transition = "all 0.35s cubic-bezier(.2,.8,.2,1)";
      s.ghost.style.left = s.startLeft + "px";
      s.ghost.style.top = s.startTop + "px";
      s.ghost.style.transform = "scale(1) rotate(0deg)";
      setTimeout(cleanup, 380);
    },
    [cleanup]
  );

  const handleUp = useCallback(
    (e: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const s = stateRef.current;
      if (!s) return;

      if (!s.crossedThreshold) {
        stateRef.current = null;
        return;
      }

      const vc = getPoolCenter();
      if (!vc) {
        cancelDrag(s);
        return;
      }
      const rect = s.ghost.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(cx - vc.x, cy - vc.y);
      if (dist < vc.r * 1.1) {
        suckIn(s, vc);
      } else {
        cancelDrag(s);
      }
      // Suppress synthesized click that follows pointerup on the origin element.
      // justDraggedRef was set when threshold was crossed.
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 0);
      void e;
    },
    [cancelDrag, getPoolCenter, handleMove, suckIn]
  );

  const getDragHandlers = useCallback(
    (tower: TowerProgress) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        stateRef.current = {
          tower,
          origin: el,
          ghost: el,
          offX: e.clientX - rect.left,
          offY: e.clientY - rect.top,
          w: rect.width,
          h: rect.height,
          startLeft: rect.left,
          startTop: rect.top,
          startX: e.clientX,
          startY: e.clientY,
          crossedThreshold: false,
        };
        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
      },
      suppressClick: () => {
        if (justDraggedRef.current) {
          justDraggedRef.current = false;
          return true;
        }
        return false;
      },
    }),
    [handleMove, handleUp]
  );

  return { poolRef, armed, draggingTowerId, getDragHandlers };
}
