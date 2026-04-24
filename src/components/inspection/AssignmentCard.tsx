import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPlus, X, AlertTriangle } from "lucide-react";
import { capitalize, formatDateTime } from "@/lib/utils";
import type { InspectionEntry, User } from "@/types/api";

interface AssignmentCardProps {
  entry: InspectionEntry;
  contractors: User[];
  onAssign: (
    contractorId: string,
    opts: { due_date?: string; notes?: string },
    force?: boolean
  ) => Promise<unknown>;
  onUnassign: (contractorId: string) => Promise<unknown>;
  pending: boolean;
}

export function AssignmentCard({
  entry,
  contractors,
  onAssign,
  onUnassign,
  pending,
}: AssignmentCardProps) {
  const active = entry.contractor_assignments[0] ?? null;
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [conflict, setConflict] = useState<{
    existingContractorId: string;
  } | null>(null);

  // Only contractors whose trades include this entry's trade may be assigned.
  // Client-side filter prevents the 422 TRADE_MISMATCH from ever firing in
  // normal flow.
  const eligible = contractors.filter(
    (c) =>
      c.is_active &&
      c.role === "CONTRACTOR" &&
      (c.trades ?? []).includes(entry.trade)
  );

  const resetForm = () => {
    setSelectedId("");
    setDueDate("");
    setNotes("");
    setShowForm(false);
    setConflict(null);
  };

  const submit = async (force: boolean) => {
    if (!selectedId) return;
    try {
      await onAssign(
        selectedId,
        {
          due_date: dueDate || undefined,
          notes: notes || undefined,
        },
        force
      );
      resetForm();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        const detail = err.response.data?.detail;
        if (
          detail &&
          typeof detail === "object" &&
          detail.code === "EXCLUSIVE_CONFLICT"
        ) {
          setConflict({
            existingContractorId: String(detail.existing_contractor_id ?? ""),
          });
          return;
        }
      }
      throw err;
    }
  };

  const existingContractor =
    conflict &&
    contractors.find((c) => c.id === conflict.existingContractorId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business Associate Assignment</CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Trade required: <strong>{entry.trade}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {active ? (
          <div className="space-y-2 text-sm">
            <div className="font-medium">{active.contractor_name}</div>
            {active.contractor_trades.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {active.contractor_trades.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500">
              Assigned {formatDateTime(active.assigned_at)}
            </div>
            {active.due_date && (
              <div className="text-xs text-gray-500">
                Due: {active.due_date}
              </div>
            )}
            {active.notes && (
              <p className="text-xs text-gray-600 italic">{active.notes}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnassign(active.contractor_id)}
              disabled={pending}
            >
              <X className="h-4 w-4 mr-2" />
              Unassign
            </Button>
          </div>
        ) : (
          <>
            {!showForm ? (
              <>
                <p className="text-sm text-gray-500">
                  No Business Associate assigned.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                  disabled={eligible.length === 0}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Business Associate
                </Button>
                {eligible.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No active {capitalize(entry.trade.toLowerCase())} Business
                    Associates are configured.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Business Associate</Label>
                  <Select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="">Select...</option>
                    {eligible.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({(c.trades ?? []).join(", ")})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Due date (optional)</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => submit(false)}
                    disabled={!selectedId || pending}
                  >
                    Assign
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {conflict && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm space-y-2">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                This entry is already assigned to{" "}
                <strong>
                  {existingContractor?.full_name ?? "another Business Associate"}
                </strong>
                . Replace the existing assignment?
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => submit(true)}
                disabled={pending}
              >
                Replace assignment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConflict(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
