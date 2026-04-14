import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFloor } from "@/api/floors";
import { listFlatsByFloor, createFlat, deleteFlat } from "@/api/flats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Home } from "lucide-react";
import type { Flat } from "@/types/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const flatSchema = z.object({
  flat_number: z.string().min(1, "Flat number is required"),
  flat_type: z.string().min(1, "Flat type is required"),
});

export default function FloorDetailPage() {
  const { fid } = useParams<{ bid: string; fid: string }>();
  const floorId = fid!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addFlatOpen, setAddFlatOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Flat | null>(null);

  const { data: floor, isLoading } = useQuery({
    queryKey: ["floor", floorId],
    queryFn: () => getFloor(floorId),
  });

  const { data: flats } = useQuery({
    queryKey: ["flats", floorId],
    queryFn: () => listFlatsByFloor(floorId),
  });

  const createFlatMutation = useMutation({
    mutationFn: (data: { flat_number: string; flat_type: string }) =>
      createFlat(floorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flats", floorId] });
      queryClient.invalidateQueries({ queryKey: ["floor", floorId] });
      setAddFlatOpen(false);
    },
  });

  const deleteFlatMutation = useMutation({
    mutationFn: deleteFlat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flats", floorId] });
      queryClient.invalidateQueries({ queryKey: ["floor", floorId] });
      setDeleteTarget(null);
    },
  });

  const flatForm = useForm<{ flat_number: string; flat_type: string }>({
    resolver: zodResolver(flatSchema),
    defaultValues: { flat_number: "", flat_type: "" },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!floor) return <div>Floor not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{floor.label}</h1>
          <p className="text-sm text-gray-500">
            Floor {floor.floor_number} — {floor.total_flats} flats
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Flats</CardTitle>
          <Button size="sm" onClick={() => setAddFlatOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Flat
          </Button>
        </CardHeader>
        <CardContent>
          {!flats?.length ? (
            <EmptyState
              icon={<Home size={48} />}
              title="No flats"
              description="Add flats to this floor to begin inspections."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {flats.map((flat) => (
                <div
                  key={flat.id}
                  className="relative group border rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
                  onClick={() =>
                    navigate(`/floors/${floorId}/flats/${flat.id}`)
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {flat.flat_number}
                    </span>
                    <StatusBadge status={flat.inspection_status} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Type: {flat.flat_type}
                  </p>
                  <button
                    type="button"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(flat);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addFlatOpen} onOpenChange={setAddFlatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Flat</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={flatForm.handleSubmit(async (data) => {
              await createFlatMutation.mutateAsync(data);
              flatForm.reset();
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Flat Number</Label>
              <Input
                placeholder="e.g., A-101"
                {...flatForm.register("flat_number")}
              />
              {flatForm.formState.errors.flat_number && (
                <p className="text-sm text-red-500">
                  {flatForm.formState.errors.flat_number.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Flat Type</Label>
              <Input
                placeholder="e.g., 2BHK, 3BHK"
                {...flatForm.register("flat_type")}
              />
              {flatForm.formState.errors.flat_type && (
                <p className="text-sm text-red-500">
                  {flatForm.formState.errors.flat_type.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddFlatOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createFlatMutation.isPending}
              >
                Add Flat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Flat"
        description={`Delete flat "${deleteTarget?.flat_number}"? All inspection data will be lost.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteFlatMutation.mutate(deleteTarget.id);
        }}
        loading={deleteFlatMutation.isPending}
      />
    </div>
  );
}
