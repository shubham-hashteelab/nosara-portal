import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFlat } from "@/api/flats";
import { listInspectionsByFlat, initializeChecklist } from "@/api/inspections";
import { listFloorPlanLayouts } from "@/api/checklists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FloorPlanView, type RoomStatus } from "@/components/common/FloorPlanView";
import { getMediaUrl } from "@/api/media";
import { ArrowLeft, ListChecks, Image, Mic } from "lucide-react";
import { capitalize } from "@/lib/utils";
import type { InspectionEntry } from "@/types/api";
import { CheckStatus } from "@/types/enums";

export default function FlatDetailPage() {
  const { flatId } = useParams<{ flatId: string }>();
  const flatIdNum = Number(flatId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const initMutation = useMutation({
    mutationFn: () => initializeChecklist(flatIdNum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections", flatIdNum] });
      queryClient.invalidateQueries({ queryKey: ["flat", flatIdNum] });
    },
  });

  const columns: Column<InspectionEntry>[] = [
    {
      key: "room_label",
      header: "Room",
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      render: (e) => capitalize(e.category),
      sortable: true,
      accessor: (e) => e.category,
    },
    {
      key: "checklist_item",
      header: "Checklist Item",
    },
    {
      key: "check_status",
      header: "Status",
      render: (e) => <StatusBadge status={e.check_status} />,
      sortable: true,
      accessor: (e) => e.check_status,
    },
    {
      key: "severity",
      header: "Severity",
      render: (e) => <SeverityBadge severity={e.severity} />,
    },
    {
      key: "snag_fix_status",
      header: "Fix Status",
      render: (e) =>
        e.snag_fix_status ? (
          <StatusBadge status={e.snag_fix_status} />
        ) : (
          <span className="text-gray-400 text-sm">--</span>
        ),
    },
    {
      key: "media",
      header: "Media",
      render: (e) => (
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
      ),
    },
  ];

  if (loadingFlat) return <LoadingSpinner />;
  if (!flat) return <div>Flat not found</div>;

  // Group entries by room for the summary
  const snagCount =
    entries?.filter((e) => e.check_status === CheckStatus.FAIL).length ?? 0;
  const passCount =
    entries?.filter((e) => e.check_status === CheckStatus.PASS).length ?? 0;
  const totalEntries = entries?.length ?? 0;

  // Floor plan data for this flat's type
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
      // "Inspected" = actively checked as PASS or FAIL (default NA means untouched)
      if (e.check_status === CheckStatus.PASS || e.check_status === CheckStatus.FAIL) {
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
        {(!entries || entries.length === 0) && (
          <Button
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending}
          >
            <ListChecks className="h-4 w-4 mr-2" />
            Initialize Checklist
          </Button>
        )}
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
                    alt={img.caption ?? "Snag photo"}
                    className="h-24 w-24 object-cover rounded-lg border cursor-pointer hover:ring-2 hover:ring-primary-500"
                    onClick={() => navigate(`/inspections/${img.entryId}`)}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspection entries table */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEntries ? (
            <LoadingSpinner />
          ) : !entries?.length ? (
            <EmptyState
              title="No inspection entries"
              description="Initialize the checklist to create inspection entries for this flat."
            />
          ) : (
            <DataTable
              data={entries}
              columns={columns}
              searchable
              searchPlaceholder="Search entries..."
              getRowKey={(e) => e.id}
              onRowClick={(e) => navigate(`/inspections/${e.id}`)}
              pageSize={20}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
