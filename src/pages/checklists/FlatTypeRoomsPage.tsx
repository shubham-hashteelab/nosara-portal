import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  listFlatTypeRooms,
  createFlatTypeRoom,
  deleteFlatTypeRoom,
} from "@/api/checklists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { capitalize } from "@/lib/utils";
import { RoomType } from "@/types/enums";
import type { FlatTypeRoom } from "@/types/api";
import { useNavigate } from "react-router-dom";

const roomSchema = z.object({
  flat_type: z.string().min(1, "Flat type is required"),
  room_type: z.nativeEnum(RoomType),
  label: z.string().min(1, "Room label is required"),
  sort_order: z.coerce.number().int().min(0).default(0),
});

type RoomForm = z.infer<typeof roomSchema>;

export default function FlatTypeRoomsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FlatTypeRoom | null>(null);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["flat-type-rooms"],
    queryFn: () => listFlatTypeRooms(),
  });

  const createMutation = useMutation({
    mutationFn: createFlatTypeRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flat-type-rooms"] });
      setAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFlatTypeRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flat-type-rooms"] });
      setDeleteTarget(null);
    },
  });

  const form = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      flat_type: "",
      room_type: RoomType.LIVING_ROOM,
      label: "",
      sort_order: 0,
    },
  });

  // Group by flat type
  const grouped = (rooms ?? []).reduce<Record<string, FlatTypeRoom[]>>(
    (acc, r) => {
      if (!acc[r.flat_type]) acc[r.flat_type] = [];
      acc[r.flat_type].push(r);
      return acc;
    },
    {}
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/checklists")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Room Definitions
          </h1>
          <p className="text-sm text-gray-500">
            Define which rooms exist in each flat type
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title="No room definitions"
              description="Add room definitions to define which rooms are included in each flat type."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([flatType, typeRooms]) => (
            <Card key={flatType}>
              <CardHeader>
                <CardTitle>{flatType}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {typeRooms
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-6">
                            {room.sort_order}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {room.label}
                            </p>
                            <p className="text-xs text-gray-500">
                              {capitalize(room.room_type)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(room)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room Definition</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) =>
              createMutation.mutate(data)
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Flat Type</Label>
              <Input
                placeholder="e.g., 2BHK, 3BHK"
                {...form.register("flat_type")}
              />
              {form.formState.errors.flat_type && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.flat_type.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select {...form.register("room_type")}>
                {Object.values(RoomType).map((rt) => (
                  <option key={rt} value={rt}>
                    {capitalize(rt)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room Label</Label>
              <Input
                placeholder="e.g., Master Bedroom, Kitchen"
                {...form.register("label")}
              />
              {form.formState.errors.label && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.label.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                {...form.register("sort_order", { valueAsNumber: true })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Add Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Room Definition"
        description={`Delete "${deleteTarget?.label}" from ${deleteTarget?.flat_type}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
