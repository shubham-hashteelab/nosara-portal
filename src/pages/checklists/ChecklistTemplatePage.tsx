import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  seedDefaults,
  listFlatTypeRooms,
} from "@/api/checklists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Download, ListChecks } from "lucide-react";
import { capitalize } from "@/lib/utils";
import { RoomType, ChecklistCategory } from "@/types/enums";
import type { ChecklistTemplate, FlatTypeRoom } from "@/types/api";
import { Link } from "react-router-dom";

const templateSchema = z.object({
  room_type: z.nativeEnum(RoomType),
  category: z.nativeEnum(ChecklistCategory),
  item_name: z.string().min(1, "Label is required"),
  sort_order: z.coerce.number().int().min(0).default(0),
});

type TemplateForm = z.infer<typeof templateSchema>;

export default function ChecklistTemplatePage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ChecklistTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(
    null
  );
  const [seedConfirm, setSeedConfirm] = useState(false);

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: listTemplates,
  });

  const { data: flatTypeRooms, isLoading: loadingRooms } = useQuery({
    queryKey: ["flat-type-rooms"],
    queryFn: () => listFlatTypeRooms(),
  });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateForm> }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setDeleteTarget(null);
    },
  });

  const seedMutation = useMutation({
    mutationFn: seedDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      queryClient.invalidateQueries({ queryKey: ["flat-type-rooms"] });
      setSeedConfirm(false);
    },
  });

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      room_type: RoomType.LIVING_ROOM,
      category: ChecklistCategory.ELECTRICAL,
      item_name: "",
      sort_order: 0,
    },
  });

  const editForm = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    values: editTarget
      ? {
          room_type: editTarget.room_type as TemplateForm["room_type"],
          category: editTarget.category as TemplateForm["category"],
          item_name: editTarget.item_name,
          sort_order: editTarget.sort_order,
        }
      : undefined,
  });

  // Group templates by room_type for lookup
  const templatesByRoomType = useMemo(() => {
    const map: Record<string, ChecklistTemplate[]> = {};
    for (const t of templates ?? []) {
      if (!map[t.room_type]) map[t.room_type] = [];
      map[t.room_type].push(t);
    }
    // Sort each group
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [templates]);

  // Group rooms by flat_type
  const roomsByFlatType = useMemo(() => {
    const map: Record<string, FlatTypeRoom[]> = {};
    for (const r of flatTypeRooms ?? []) {
      if (!map[r.flat_type]) map[r.flat_type] = [];
      map[r.flat_type].push(r);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [flatTypeRooms]);

  const flatTypes = Object.keys(roomsByFlatType).sort();
  const defaultTab = flatTypes[0] ?? "";

  if (loadingTemplates || loadingRooms) return <LoadingSpinner />;

  const totalItems = templates?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Checklist Templates
          </h1>
          <p className="text-sm text-gray-500">
            {totalItems} inspection items across {flatTypes.length} flat types
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/checklists/room-definitions">
            <Button variant="outline">
              <ListChecks className="h-4 w-4 mr-2" />
              Room Definitions
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setSeedConfirm(true)}>
            <Download className="h-4 w-4 mr-2" />
            Seed Defaults
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {flatTypes.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              title="No flat types defined"
              description="Seed defaults or add room definitions to get started."
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex flex-wrap">
            {flatTypes.map((ft) => {
              const rooms = roomsByFlatType[ft] ?? [];
              const itemCount = rooms.reduce(
                (sum, r) => sum + (templatesByRoomType[r.room_type]?.length ?? 0),
                0
              );
              return (
                <TabsTrigger key={ft} value={ft}>
                  {ft}
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {rooms.length} rooms / {itemCount} items
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {flatTypes.map((ft) => {
            const rooms = roomsByFlatType[ft] ?? [];
            return (
              <TabsContent key={ft} value={ft} className="space-y-4 mt-4">
                {rooms.map((room) => {
                  const items = templatesByRoomType[room.room_type] ?? [];
                  return (
                    <Card key={room.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          {room.label}
                          <Badge variant="secondary" className="text-xs font-normal">
                            {capitalize(room.room_type)}
                          </Badge>
                          <span className="text-xs text-gray-400 font-normal">
                            {items.length} items
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {items.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No checklist items for {capitalize(room.room_type)}.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {items.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-400 w-5 text-right">
                                    {t.sort_order}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {t.item_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {capitalize(t.category)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!t.is_active && (
                                    <Badge variant="secondary">Inactive</Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditTarget(t)}
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteTarget(t)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) =>
              createMutation.mutate(data)
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Category</Label>
                <Select {...form.register("category")}>
                  {Object.values(ChecklistCategory).map((c) => (
                    <option key={c} value={c}>
                      {capitalize(c)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Item Label</Label>
              <Input
                placeholder="e.g., Check power outlet functionality"
                {...form.register("item_name")}
              />
              {form.formState.errors.item_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.item_name.message}
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
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Checklist Item</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate({
                id: editTarget!.id,
                data: {
                  item_name: data.item_name,
                  sort_order: data.sort_order,
                },
              })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Item Label</Label>
              <Input {...editForm.register("item_name")} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                {...editForm.register("sort_order", { valueAsNumber: true })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Checklist Item"
        description={`Delete "${deleteTarget?.item_name}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />

      {/* Seed confirm */}
      <ConfirmDialog
        open={seedConfirm}
        onOpenChange={setSeedConfirm}
        title="Seed Default Templates"
        description="This will add default checklist items, room definitions, and floor plan layouts."
        confirmLabel="Seed Defaults"
        variant="default"
        onConfirm={() => seedMutation.mutate()}
        loading={seedMutation.isPending}
      />
    </div>
  );
}
