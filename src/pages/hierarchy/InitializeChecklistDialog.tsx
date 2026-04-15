import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getChecklistPreview,
  type ChecklistPreviewRoom,
} from "@/api/inspections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { capitalize } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface InitializeChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flatId: string;
  flatType: string;
  onConfirm: (templateIds: string[]) => void;
  loading?: boolean;
}

export function InitializeChecklistDialog({
  open,
  onOpenChange,
  flatId,
  flatType,
  onConfirm,
  loading,
}: InitializeChecklistDialogProps) {
  const { data: preview, isLoading } = useQuery({
    queryKey: ["checklistPreview", flatId],
    queryFn: () => getChecklistPreview(flatId),
    enabled: open,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Select all by default when preview loads
  useMemo(() => {
    if (preview && !initialized) {
      const allIds = new Set<string>();
      for (const room of preview) {
        for (const item of room.items) {
          allIds.add(item.template_id);
        }
      }
      setSelectedIds(allIds);
      setExpandedRooms(new Set(preview.map((r) => r.room_label)));
      setInitialized(true);
    }
  }, [preview, initialized]);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setInitialized(false);
      setSelectedIds(new Set());
      setExpandedRooms(new Set());
    }
    onOpenChange(isOpen);
  };

  const toggleRoom = (room: ChecklistPreviewRoom) => {
    const roomIds = room.items.map((i) => i.template_id);
    const allSelected = roomIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        roomIds.forEach((id) => next.delete(id));
      } else {
        roomIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleItem = (templateId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const toggleExpandRoom = (roomLabel: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomLabel)) {
        next.delete(roomLabel);
      } else {
        next.add(roomLabel);
      }
      return next;
    });
  };

  const totalItems = preview?.reduce((sum, r) => sum + r.items.length, 0) ?? 0;
  const selectedCount = selectedIds.size;

  const selectAll = () => {
    if (!preview) return;
    const allIds = new Set<string>();
    for (const room of preview) {
      for (const item of room.items) {
        allIds.add(item.template_id);
      }
    }
    setSelectedIds(allIds);
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Initialize Checklist — {flatType}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Select rooms and items to create inspection entries for this flat.
          </p>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm py-2 border-b">
          <span className="text-gray-600">
            {selectedCount} of {totalItems} items selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-blue-600 hover:underline text-xs"
              onClick={selectAll}
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              className="text-blue-600 hover:underline text-xs"
              onClick={selectNone}
            >
              Select none
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {isLoading ? (
            <LoadingSpinner />
          ) : !preview?.length ? (
            <p className="text-center text-gray-500 py-8">
              No checklist templates found for this flat type.
            </p>
          ) : (
            preview.map((room) => {
              const roomIds = room.items.map((i) => i.template_id);
              const allSelected = roomIds.every((id) => selectedIds.has(id));
              const someSelected =
                !allSelected && roomIds.some((id) => selectedIds.has(id));
              const isExpanded = expandedRooms.has(room.room_label);

              return (
                <div key={room.room_label} className="border rounded-lg">
                  {/* Room header */}
                  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={() => toggleRoom(room)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      className="flex-1 flex items-center gap-2 text-left"
                      onClick={() => toggleExpandRoom(room.room_label)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-sm">
                        {room.room_label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {room.items.length} items
                      </span>
                    </button>
                  </div>

                  {/* Items */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50/50 px-3 py-1">
                      {room.items.map((item) => (
                        <label
                          key={item.template_id}
                          className="flex items-center gap-3 px-6 py-1.5 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.template_id)}
                            onChange={() => toggleItem(item.template_id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm flex-1">
                            {item.item_name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {capitalize(item.category)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(Array.from(selectedIds))}
            disabled={loading || selectedCount === 0}
          >
            {loading
              ? "Initializing..."
              : `Initialize ${selectedCount} Items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
