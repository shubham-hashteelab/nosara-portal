import { useState } from "react";
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
} from "@/api/checklists";
import { Card, CardContent } from "@/components/ui/card";
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
import type { ChecklistTemplate } from "@/types/api";
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
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(null);
  const [seedConfirm, setSeedConfirm] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: listTemplates,
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

  // Group templates by room type
  const grouped = (templates ?? []).reduce<
    Record<string, ChecklistTemplate[]>
  >((acc, t) => {
    if (!acc[t.room_type]) acc[t.room_type] = [];
    acc[t.room_type].push(t);
    return acc;
  }, {});

  const roomTypes = Object.values(RoomType);
  const defaultTab = roomTypes.find((rt) => grouped[rt]?.length) ?? roomTypes[0];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Checklist Templates
          </h1>
          <p className="text-sm text-gray-500">
            Define inspection items for each room type and category
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

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue={defaultTab}>
            <TabsList className="flex flex-wrap">
              {roomTypes.map((rt) => (
                <TabsTrigger key={rt} value={rt}>
                  {capitalize(rt)}
                  {grouped[rt] && (
                    <Badge variant="secondary" className="ml-1.5 text-xs">
                      {grouped[rt].length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {roomTypes.map((rt) => (
              <TabsContent key={rt} value={rt}>
                {!grouped[rt]?.length ? (
                  <EmptyState
                    title="No items"
                    description={`No checklist items for ${capitalize(rt)} yet.`}
                  />
                ) : (
                  <div className="space-y-2 mt-4">
                    {grouped[rt]
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-6">
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
                          <div className="flex items-center gap-2">
                            {!t.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditTarget(t)}
                            >
                              <Pencil className="h-4 w-4 text-gray-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(t)}
                            >
                              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

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
                  {roomTypes.map((rt) => (
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
        description="This will add default checklist items. Existing items will not be affected."
        confirmLabel="Seed Defaults"
        variant="default"
        onConfirm={() => seedMutation.mutate()}
        loading={seedMutation.isPending}
      />
    </div>
  );
}
