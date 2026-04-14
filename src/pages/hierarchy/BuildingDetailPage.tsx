import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBuilding } from "@/api/buildings";
import { listFloorsByBuilding, createFloor, deleteFloor } from "@/api/floors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { Floor } from "@/types/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const floorSchema = z.object({
  floor_number: z.coerce.number().int().min(0, "Must be >= 0"),
  label: z.string().min(1, "Label is required"),
});

export default function BuildingDetailPage() {
  const { id, bid } = useParams<{ id: string; bid: string }>();
  const buildingId = Number(bid);
  const projectId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Floor | null>(null);

  const { data: building, isLoading } = useQuery({
    queryKey: ["building", buildingId],
    queryFn: () => getBuilding(buildingId),
  });

  const { data: floors } = useQuery({
    queryKey: ["floors", buildingId],
    queryFn: () => listFloorsByBuilding(buildingId),
  });

  const createFloorMutation = useMutation({
    mutationFn: (data: { floor_number: number; label: string }) =>
      createFloor({ building_id: buildingId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors", buildingId] });
      queryClient.invalidateQueries({ queryKey: ["building", buildingId] });
      setAddFloorOpen(false);
    },
  });

  const deleteFloorMutation = useMutation({
    mutationFn: deleteFloor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors", buildingId] });
      queryClient.invalidateQueries({ queryKey: ["building", buildingId] });
      setDeleteTarget(null);
    },
  });

  const floorForm = useForm<{ floor_number: number; label: string }>({
    resolver: zodResolver(floorSchema),
    defaultValues: { floor_number: 0, label: "" },
  });

  const columns: Column<Floor>[] = [
    {
      key: "floor_number",
      header: "Floor No.",
      sortable: true,
    },
    { key: "label", header: "Label", sortable: true },
    { key: "total_flats", header: "Flats", sortable: true },
    {
      key: "actions",
      header: "",
      render: (f) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(f);
          }}
        >
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (!building) return <div>Building not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{building.name}</h1>
          <p className="text-sm text-gray-500">
            {building.total_floors} floors, {building.total_flats} flats
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Floors</CardTitle>
          <Button size="sm" onClick={() => setAddFloorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Floor
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={floors ?? []}
            columns={columns}
            getRowKey={(f) => f.id}
            onRowClick={(f) =>
              navigate(`/buildings/${buildingId}/floors/${f.id}`)
            }
          />
        </CardContent>
      </Card>

      <Dialog open={addFloorOpen} onOpenChange={setAddFloorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Floor</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={floorForm.handleSubmit(async (data) => {
              await createFloorMutation.mutateAsync(data);
              floorForm.reset();
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Floor Number</Label>
              <Input
                type="number"
                {...floorForm.register("floor_number", {
                  valueAsNumber: true,
                })}
              />
              {floorForm.formState.errors.floor_number && (
                <p className="text-sm text-red-500">
                  {floorForm.formState.errors.floor_number.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                placeholder="e.g., Ground Floor"
                {...floorForm.register("label")}
              />
              {floorForm.formState.errors.label && (
                <p className="text-sm text-red-500">
                  {floorForm.formState.errors.label.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddFloorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createFloorMutation.isPending}
              >
                Add Floor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Floor"
        description={`Delete "${deleteTarget?.label}"? All flats and inspections on this floor will be deleted.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteFloorMutation.mutate(deleteTarget.id);
        }}
        loading={deleteFloorMutation.isPending}
      />
    </div>
  );
}
