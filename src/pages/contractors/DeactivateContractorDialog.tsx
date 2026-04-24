import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { OpenAssignmentEntry, User } from "@/types/api";

interface DeactivateContractorDialogProps {
  open: boolean;
  user: User | null;
  /**
   * `null` means the manager hasn't attempted deactivation yet. An array
   * (possibly empty) means the backend returned 409 with that orphan list
   * and we're now showing the force-deactivate path.
   */
  openAssignments: OpenAssignmentEntry[] | null;
  onClose: () => void;
  onDeactivate: () => void;
  onForceDeactivate: () => void;
  pending: boolean;
}

export function DeactivateContractorDialog({
  open,
  user,
  openAssignments,
  onClose,
  onDeactivate,
  onForceDeactivate,
  pending,
}: DeactivateContractorDialogProps) {
  if (!user) return null;

  const hasConflict = openAssignments !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {hasConflict
              ? `${user.full_name} has open assignments`
              : `Deactivate ${user.full_name}?`}
          </DialogTitle>
        </DialogHeader>

        {!hasConflict ? (
          <p className="text-sm text-gray-600">
            This Business Associate will no longer be able to log into the
            mobile app. Any currently-assigned snags will remain linked until
            they are reassigned or verified.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {openAssignments.length === 0
                  ? "No open assignments — safe to deactivate."
                  : "The following snag entries are assigned to this Business Associate and are not yet verified. Reassign them first from the inspection detail page, or force-deactivate and handle them from the Orphaned Assignments queue."}
              </span>
            </div>
            {openAssignments.length > 0 && (
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Item</th>
                      <th className="text-left px-3 py-2 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {openAssignments.map((entry) => (
                      <tr
                        key={entry.entry_id}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2">{entry.item_name}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {entry.snag_fix_status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!hasConflict ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onDeactivate}
                disabled={pending}
              >
                {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Deactivate
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {openAssignments.length > 0 && (
                <Link to="/orphaned-assignments" onClick={onClose}>
                  <Button variant="outline">Open Orphaned Assignments</Button>
                </Link>
              )}
              <Button
                variant="destructive"
                onClick={onForceDeactivate}
                disabled={pending}
              >
                {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {openAssignments.length > 0 ? "Force-deactivate" : "Deactivate"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
