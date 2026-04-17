import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
  listFloorPlanLayouts,
} from "@/api/checklists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { FloorPlanView } from "@/components/common/FloorPlanView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  Download,
  ListChecks,
  ArrowLeft,
  MousePointerClick,
} from "lucide-react";
import { capitalize } from "@/lib/utils";
import { RoomType, ChecklistCategory } from "@/types/enums";
import type {
  ChecklistTemplate,
  FlatTypeRoom,
  FloorPlanLayout,
} from "@/types/api";

const templateSchema = z.object({
  room_type: z.nativeEnum(RoomType),
  category: z.nativeEnum(ChecklistCategory),
  item_name: z.string().min(1, "Label is required"),
  sort_order: z.coerce.number().int().min(0).default(0),
});

type TemplateForm = z.infer<typeof templateSchema>;

export default function BlueprintsPage() {
  const navigate = useNavigate();
  const params = useParams<{ flatType?: string }>();
  const selectedFlatType = params.flatType
    ? decodeURIComponent(params.flatType)
    : null;

  const queryClient = useQueryClient();

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: listTemplates,
  });

  const { data: flatTypeRooms, isLoading: loadingRooms } = useQuery({
    queryKey: ["flat-type-rooms"],
    queryFn: () => listFlatTypeRooms(),
  });

  const { data: layouts, isLoading: loadingLayouts } = useQuery({
    queryKey: ["floorPlanLayouts"],
    queryFn: () => listFloorPlanLayouts(),
  });

  const [addRoomType, setAddRoomType] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ChecklistTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(
    null
  );
  const [seedConfirm, setSeedConfirm] = useState(false);
  const [selectedRoomLabel, setSelectedRoomLabel] = useState<string | null>(
    null
  );

  // Reset selected room when flat type changes
  useEffect(() => {
    setSelectedRoomLabel(null);
  }, [selectedFlatType]);

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setAddRoomType(null);
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
      queryClient.invalidateQueries({ queryKey: ["floorPlanLayouts"] });
      setSeedConfirm(false);
    },
  });

  const addForm = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      room_type: RoomType.LIVING_ROOM,
      category: ChecklistCategory.ELECTRICAL,
      item_name: "",
      sort_order: 0,
    },
  });

  // When opening the add dialog, pre-fill the room_type from the selected room
  useEffect(() => {
    if (addRoomType) {
      addForm.reset({
        room_type: addRoomType as TemplateForm["room_type"],
        category: ChecklistCategory.ELECTRICAL,
        item_name: "",
        sort_order: 0,
      });
    }
  }, [addRoomType, addForm]);

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

  // Group templates by room_type
  const templatesByRoomType = useMemo(() => {
    const map: Record<string, ChecklistTemplate[]> = {};
    for (const t of templates ?? []) {
      if (!map[t.room_type]) map[t.room_type] = [];
      map[t.room_type].push(t);
    }
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

  // Group layouts by flat_type
  const layoutsByFlatType = useMemo(() => {
    const map: Record<string, FloorPlanLayout[]> = {};
    for (const l of layouts ?? []) {
      if (!map[l.flat_type]) map[l.flat_type] = [];
      map[l.flat_type].push(l);
    }
    return map;
  }, [layouts]);

  const flatTypes = useMemo(
    () =>
      Array.from(
        new Set([
          ...Object.keys(roomsByFlatType),
          ...Object.keys(layoutsByFlatType),
        ])
      ).sort(),
    [roomsByFlatType, layoutsByFlatType]
  );

  if (loadingTemplates || loadingRooms || loadingLayouts) {
    return <LoadingSpinner />;
  }

  const pageActions = (
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
    </div>
  );

  /* ───────── Gallery mode ───────── */
  if (!selectedFlatType) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blueprints</h1>
            <p className="text-sm text-gray-500">
              Floor plans and inspection checklists per flat type
            </p>
          </div>
          {pageActions}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flatTypes.map((ft) => {
              const typeLayouts = layoutsByFlatType[ft] ?? [];
              const typeRooms = roomsByFlatType[ft] ?? [];
              const itemCount = typeRooms.reduce(
                (sum, r) =>
                  sum + (templatesByRoomType[r.room_type]?.length ?? 0),
                0
              );
              return (
                <Card
                  key={ft}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    navigate(`/blueprints/${encodeURIComponent(ft)}`)
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{ft}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {typeRooms.length} rooms · {itemCount} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {typeLayouts.length > 0 ? (
                      <FloorPlanView layouts={typeLayouts} compact />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl">
                        No floor plan layout
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {renderSeedConfirm()}
      </div>
    );
  }

  /* ───────── Detail mode ───────── */
  const typeLayouts = layoutsByFlatType[selectedFlatType] ?? [];
  const typeRooms = roomsByFlatType[selectedFlatType] ?? [];

  // Resolve the selected room object. We select by layout room_label (which
  // equals the FlatTypeRoom.label in seeded data).
  const selectedRoom =
    selectedRoomLabel != null
      ? typeRooms.find((r) => r.label === selectedRoomLabel) ?? null
      : null;

  const selectedRoomItems = selectedRoom
    ? templatesByRoomType[selectedRoom.room_type] ?? []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/blueprints")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedFlatType}
            </h1>
            <p className="text-sm text-gray-500">
              {typeRooms.length} rooms ·{" "}
              {typeRooms.reduce(
                (sum, r) =>
                  sum + (templatesByRoomType[r.room_type]?.length ?? 0),
                0
              )}{" "}
              inspection items
            </p>
          </div>
        </div>
        {pageActions}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — floor plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layout</CardTitle>
          </CardHeader>
          <CardContent>
            {typeLayouts.length > 0 ? (
              <FloorPlanView
                layouts={typeLayouts}
                onRoomClick={(label) => setSelectedRoomLabel(label)}
                selectedRoom={selectedRoomLabel}
              />
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">
                No floor plan layout for {selectedFlatType}.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — checklist for selected room */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {selectedRoom ? (
                    <>
                      {selectedRoom.label}
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {capitalize(selectedRoom.room_type)}
                      </Badge>
                    </>
                  ) : (
                    "Checklist"
                  )}
                </CardTitle>
                {selectedRoom && (
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedRoomItems.length} items
                  </p>
                )}
              </div>
              {selectedRoom && (
                <Button
                  size="sm"
                  onClick={() => setAddRoomType(selectedRoom.room_type)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Item
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRoom ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400">
                <MousePointerClick className="h-8 w-8 mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  Click a room on the floor plan
                </p>
                <p className="text-xs mt-1">
                  Its checklist items will appear here
                </p>
              </div>
            ) : selectedRoomItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No checklist items for {capitalize(selectedRoom.room_type)}.
              </div>
            ) : (
              <div className="space-y-1">
                {selectedRoomItems.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 text-right">
                        {t.sort_order}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{t.item_name}</p>
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
      </div>

      {/* Add dialog — room_type locked to the selected room */}
      <Dialog
        open={!!addRoomType}
        onOpenChange={(open) => !open && setAddRoomType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Checklist Item
              {addRoomType && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  · {capitalize(addRoomType)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addForm.handleSubmit((data) =>
              createMutation.mutate(data)
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Category</Label>
              <Select {...addForm.register("category")}>
                {Object.values(ChecklistCategory).map((c) => (
                  <option key={c} value={c}>
                    {capitalize(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Item Label</Label>
              <Input
                placeholder="e.g., Check power outlet functionality"
                {...addForm.register("item_name")}
              />
              {addForm.formState.errors.item_name && (
                <p className="text-sm text-red-500">
                  {addForm.formState.errors.item_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                {...addForm.register("sort_order", { valueAsNumber: true })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddRoomType(null)}
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
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
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

      {renderSeedConfirm()}
    </div>
  );

  function renderSeedConfirm() {
    return (
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
    );
  }
}
