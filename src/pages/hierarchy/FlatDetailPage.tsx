import { useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFlat } from "@/api/flats";
import { listInspectionsByFlat } from "@/api/inspections";
import { listFloorPlanLayouts } from "@/api/checklists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { FloorPlanView, type RoomStatus } from "@/components/common/FloorPlanView";
import { getMediaUrl } from "@/api/media";
import { ArrowLeft, Image, Mic, ChevronDown, ChevronRight, X } from "lucide-react";
import { capitalize } from "@/lib/utils";
import type { InspectionEntry } from "@/types/api";

export default function FlatDetailPage() {
  const { flatId } = useParams<{ flatId: string }>();
  const flatIdNum = flatId!;
  const navigate = useNavigate();

  const { data: flat, isLoading: loadingFlat } = useQuery({
    queryKey: ["flat", flatIdNum],
    queryFn: () => getFlat(flatIdNum),
  });

  const { data: entries, isLoading: loadingEntries } = useQuery({
    queryKey: ["inspections", flatIdNum],
    queryFn: () => listInspectionsByFlat(flatIdNum),
  });

  const { data: allLayouts } = useQuery({
    queryKey: ["floorPlanLayouts"],
    queryFn: () => listFloorPlanLayouts(),
  });

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const entriesSectionRef = useRef<HTMLDivElement>(null);

  // Hooks must be called before any early returns
  const snagCount =
    entries?.filter((e) => e.status === "FAIL").length ?? 0;
  const passCount =
    entries?.filter((e) => e.status === "PASS").length ?? 0;
  const totalEntries = entries?.length ?? 0;

  const flatLayouts = useMemo(
    () =>
      allLayouts?.filter((l) => l.flat_type === flat?.flat_type) ?? [],
    [allLayouts, flat?.flat_type]
  );

  const roomStatuses: RoomStatus[] = useMemo(() => {
    if (!entries?.length) return [];
    const map = new Map<string, { inspected: number; total: number }>();
    for (const e of entries) {
      const existing = map.get(e.room_label) ?? { inspected: 0, total: 0 };
      existing.total += 1;
      if (e.status === "PASS" || e.status === "FAIL") {
        existing.inspected += 1;
      }
      map.set(e.room_label, existing);
    }
    return Array.from(map.entries()).map(([label, s]) => ({
      label,
      inspectedCount: s.inspected,
      totalCount: s.total,
    }));
  }, [entries]);

  // Group entries by room for the room-wise view
  const roomEntries = useMemo(() => {
    if (!entries?.length) return new Map<string, InspectionEntry[]>();
    const map = new Map<string, InspectionEntry[]>();
    for (const e of entries) {
      const existing = map.get(e.room_label) ?? [];
      existing.push(e);
      map.set(e.room_label, existing);
    }
    return map;
  }, [entries]);

  const handleRoomClick = (roomLabel: string) => {
    setSelectedRoom((prev) => (prev === roomLabel ? null : roomLabel));
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomLabel)) {
        next.delete(roomLabel);
      } else {
        next.add(roomLabel);
      }
      return next;
    });
    // Scroll to entries section
    setTimeout(() => {
      entriesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const toggleRoom = (roomLabel: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomLabel)) {
        next.delete(roomLabel);
      } else {
        next.add(roomLabel);
      }
      return next;
    });
    setSelectedRoom(roomLabel);
  };

  if (loadingFlat) return <LoadingSpinner />;
  if (!flat) return <div>Flat not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Flat {flat.flat_number}
          </h1>
          <p className="text-sm text-gray-500">
            Type: {flat.flat_type} —{" "}
            <StatusBadge status={flat.inspection_status} />
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{totalEntries}</p>
            <p className="text-xs text-gray-500">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{passCount}</p>
            <p className="text-xs text-gray-500">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{snagCount}</p>
            <p className="text-xs text-gray-500">Snags</p>
          </CardContent>
        </Card>
      </div>

      {/* Floor Plan */}
      {flatLayouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Floor Plan — {flat.flat_type}</CardTitle>
          </CardHeader>
          <CardContent>
            <FloorPlanView
              layouts={flatLayouts}
              roomStatuses={roomStatuses}
              onRoomClick={handleRoomClick}
              selectedRoom={selectedRoom}
            />
          </CardContent>
        </Card>
      )}

      {/* Images preview (first few) */}
      {entries && entries.some((e) => e.images.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {entries
                .flatMap((e) =>
                  e.images.map((img) => ({ ...img, entryId: e.id }))
                )
                .slice(0, 8)
                .map((img) => (
                  <img
                    key={img.id}
                    src={getMediaUrl(img.minio_key)}
                    alt={img.original_filename ?? "Snag photo"}
                    className="h-24 w-24 object-cover rounded-lg border cursor-pointer hover:ring-2 hover:ring-primary-500"
                    onClick={() => navigate(`/inspections/${img.entryId}`)}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room-wise inspection entries */}
      <div ref={entriesSectionRef}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inspection Entries</CardTitle>
            {selectedRoom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRoom(null);
                  setExpandedRooms(new Set());
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear filter
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingEntries ? (
              <LoadingSpinner />
            ) : !entries?.length ? (
              <EmptyState
                title="No inspection entries"
                description="This flat's type has no rooms or checklist items yet. Define them in Blueprints to auto-populate."
              />
            ) : (
              <div className="space-y-3">
                {Array.from(roomEntries.entries())
                  .filter(([label]) => !selectedRoom || label === selectedRoom)
                  .map(([roomLabel, roomItems]) => {
                    const inspected = roomItems.filter(
                      (e) => e.status === "PASS" || e.status === "FAIL"
                    ).length;
                    const total = roomItems.length;
                    const pct = total > 0 ? Math.round((inspected / total) * 100) : 0;
                    const snags = roomItems.filter((e) => e.status === "FAIL").length;
                    const passed = roomItems.filter((e) => e.status === "PASS").length;
                    const pending = total - inspected;
                    const isExpanded = expandedRooms.has(roomLabel);

                    return (
                      <div
                        key={roomLabel}
                        className={`border rounded-lg overflow-hidden ${
                          selectedRoom === roomLabel ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        {/* Room header with progress bar */}
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          onClick={() => toggleRoom(roomLabel)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <span className="font-medium text-sm min-w-[120px] text-left">
                            {roomLabel}
                          </span>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full flex">
                                {passed > 0 && (
                                  <div
                                    className="bg-green-500 h-full"
                                    style={{ width: `${(passed / total) * 100}%` }}
                                  />
                                )}
                                {snags > 0 && (
                                  <div
                                    className="bg-red-500 h-full"
                                    style={{ width: `${(snags / total) * 100}%` }}
                                  />
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 min-w-[40px] text-right">
                              {pct}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 ml-2">
                            <span className="text-green-600">{passed} passed</span>
                            <span className="text-red-600">{snags} snags</span>
                            <span className="text-gray-400">{pending} pending</span>
                          </div>
                        </button>

                        {/* Expanded entries for this room */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50/50">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-xs text-gray-500">
                                  <th className="px-4 py-2 font-medium">Category</th>
                                  <th className="px-4 py-2 font-medium">Checklist Item</th>
                                  <th className="px-4 py-2 font-medium">Status</th>
                                  <th className="px-4 py-2 font-medium">Severity</th>
                                  <th className="px-4 py-2 font-medium">Fix Status</th>
                                  <th className="px-4 py-2 font-medium">Notes</th>
                                  <th className="px-4 py-2 font-medium">Media</th>
                                </tr>
                              </thead>
                              <tbody>
                                {roomItems.map((e) => (
                                  <tr
                                    key={e.id}
                                    className="border-b last:border-0 hover:bg-white cursor-pointer"
                                    onClick={() => navigate(`/inspections/${e.id}`)}
                                  >
                                    <td className="px-4 py-2.5">{capitalize(e.category)}</td>
                                    <td className="px-4 py-2.5">{e.item_name}</td>
                                    <td className="px-4 py-2.5">
                                      <StatusBadge status={e.status} />
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <SeverityBadge severity={e.severity} />
                                    </td>
                                    <td className="px-4 py-2.5">
                                      {e.snag_fix_status ? (
                                        <StatusBadge status={e.snag_fix_status} />
                                      ) : (
                                        <span className="text-gray-400">--</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 max-w-[200px] truncate text-gray-600">
                                      {e.notes || "--"}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-2">
                                        {e.images.length > 0 && (
                                          <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Image className="h-3 w-3" /> {e.images.length}
                                          </span>
                                        )}
                                        {e.voice_notes.length > 0 && (
                                          <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Mic className="h-3 w-3" /> {e.voice_notes.length}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Media preview for this room */}
                            {roomItems.some((e) => e.images.length > 0) && (
                              <div className="px-4 py-3 border-t">
                                <p className="text-xs font-medium text-gray-500 mb-2">Photos</p>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {roomItems
                                    .flatMap((e) =>
                                      e.images.map((img) => ({ ...img, entryId: e.id }))
                                    )
                                    .map((img) => (
                                      <img
                                        key={img.id}
                                        src={getMediaUrl(img.minio_key)}
                                        alt={img.original_filename ?? "Snag photo"}
                                        className="h-20 w-20 object-cover rounded-md border cursor-pointer hover:ring-2 hover:ring-primary-500"
                                        onClick={() => navigate(`/inspections/${img.entryId}`)}
                                      />
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
