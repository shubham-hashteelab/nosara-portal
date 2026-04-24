import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getInspectionEntry,
  updateInspectionEntry,
  assignContractorToSnag,
  unassignContractorFromSnag,
  verifyEntry,
  rejectEntry,
} from "@/api/inspections";
import { listContractors } from "@/api/contractors";
import { getMediaUrl } from "@/api/media";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AssignmentCard } from "@/components/inspection/AssignmentCard";
import { FixTimeline } from "@/components/inspection/FixTimeline";
import { NCGallery } from "@/components/inspection/NCGallery";
import { ClosureGallery } from "@/components/inspection/ClosureGallery";
import { RemarkDialog } from "@/components/inspection/RemarkDialog";
import {
  ArrowLeft,
  Save,
  X,
  Mic,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { capitalize, formatDateTime } from "@/lib/utils";

const STATUS_VALUES = ["NA", "PASS", "FAIL"] as const;
const SEVERITY_VALUES = ["CRITICAL", "MAJOR", "MINOR"] as const;

const updateSchema = z.object({
  status: z.string(),
  severity: z.string().nullable(),
  notes: z.string().nullable(),
});

type UpdateForm = z.infer<typeof updateSchema>;

export default function InspectionDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const id = entryId!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [remarkMode, setRemarkMode] = useState<"verify" | "reject" | null>(
    null
  );

  const { data: entry, isLoading } = useQuery({
    queryKey: ["inspection", id],
    queryFn: () => getInspectionEntry(id),
  });

  const { data: contractors } = useQuery({
    queryKey: ["contractors"],
    queryFn: listContractors,
  });

  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    values: entry
      ? {
          status: entry.status,
          severity: entry.severity,
          notes: entry.notes,
        }
      : undefined,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["inspection", id] });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateForm) =>
      updateInspectionEntry(id, {
        status: data.status,
        severity: data.severity,
        notes: data.notes,
      }),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: ({
      contractorId,
      opts,
      force,
    }: {
      contractorId: string;
      opts: { due_date?: string; notes?: string };
      force: boolean;
    }) => assignContractorToSnag(id, contractorId, opts, force),
    onSuccess: invalidate,
  });

  const unassignMutation = useMutation({
    mutationFn: (contractorId: string) =>
      unassignContractorFromSnag(id, contractorId),
    onSuccess: invalidate,
  });

  const verifyMutation = useMutation({
    mutationFn: (remark: string) =>
      verifyEntry(id, { verification_remark: remark }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["verification-queue"] });
      setRemarkMode(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (remark: string) =>
      rejectEntry(id, { rejection_remark: remark }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["verification-queue"] });
      setRemarkMode(null);
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!entry) return <div>Entry not found</div>;

  const wasRejected =
    entry.rejected_at !== null && entry.snag_fix_status === "OPEN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{entry.item_name}</h1>
          <p className="text-sm text-gray-500">
            {entry.room_label} — {capitalize(entry.category)} — Entry #{entry.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={entry.status} />
          <SeverityBadge severity={entry.severity} />
          <Badge variant="secondary">{entry.snag_fix_status}</Badge>
        </div>
      </div>

      {wasRejected && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">
              Rejected — Business Associate needs to rework this snag.
            </div>
            {entry.rejection_remark && (
              <p className="mt-1 text-red-700 italic">
                {entry.rejection_remark}
              </p>
            )}
            {entry.rejected_at && (
              <p className="mt-1 text-xs text-red-600">
                Rejected {formatDateTime(entry.rejected_at)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Update form + galleries + timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((data) =>
                  updateMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select {...form.register("status")}>
                      {STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {capitalize(s)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={form.watch("severity") ?? ""}
                      onChange={(e) =>
                        form.setValue("severity", e.target.value || null)
                      }
                    >
                      <option value="">None</option>
                      {SEVERITY_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {capitalize(s)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Add notes..."
                    value={form.watch("notes") ?? ""}
                    onChange={(e) =>
                      form.setValue("notes", e.target.value || null)
                    }
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Fix status transitions (FIXED / VERIFIED / OPEN after reject)
                  use the dedicated flow — they can't be set directly here.
                </p>
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {updateMutation.isSuccess && (
                  <span className="text-sm text-green-600 ml-3">
                    Saved successfully
                  </span>
                )}
              </form>
            </CardContent>
          </Card>

          <NCGallery images={entry.images} onLightbox={setLightboxImage} />
          {entry.status === "FAIL" && (
            <ClosureGallery
              images={entry.images}
              onLightbox={setLightboxImage}
            />
          )}

          {/* Voice notes */}
          {entry.voice_notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Notes ({entry.voice_notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.voice_notes.map((vn) => (
                  <div
                    key={vn.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <audio
                      controls
                      src={getMediaUrl(vn.minio_key)}
                      className="flex-1 h-10"
                    />
                    <div className="text-xs text-gray-500 shrink-0">
                      {vn.duration_ms
                        ? `${Math.round(vn.duration_ms / 1000)}s`
                        : ""}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Videos */}
          {entry.videos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Videos ({entry.videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="rounded-lg overflow-hidden border"
                  >
                    <video
                      controls
                      src={getMediaUrl(vid.minio_key)}
                      className="w-full max-h-[400px]"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Details + Assignment + Timeline + inline verify/reject */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Room</span>
                <span className="font-medium">{entry.room_label}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium">
                  {capitalize(entry.category)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Trade</span>
                <span className="font-medium">{entry.trade}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Inspector</span>
                <span className="font-medium">
                  {entry.inspector_id ?? "Unassigned"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">
                  {formatDateTime(entry.created_at)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="font-medium">
                  {formatDateTime(entry.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {entry.status === "FAIL" && (
            <>
              <AssignmentCard
                entry={entry}
                contractors={contractors ?? []}
                onAssign={(contractorId, opts, force) =>
                  assignMutation.mutateAsync({
                    contractorId,
                    opts,
                    force: force ?? false,
                  })
                }
                onUnassign={(contractorId) =>
                  unassignMutation.mutateAsync(contractorId)
                }
                pending={
                  assignMutation.isPending || unassignMutation.isPending
                }
              />

              {entry.snag_fix_status === "FIXED" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Manager Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-500">
                      The Business Associate has marked this fixed. Verify or
                      reject the closure.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setRemarkMode("verify")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRemarkMode("reject")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <FixTimeline entry={entry} />
            </>
          )}
        </div>
      </div>

      <RemarkDialog
        open={remarkMode !== null}
        mode={remarkMode ?? "verify"}
        entryName={entry.item_name}
        pending={verifyMutation.isPending || rejectMutation.isPending}
        onConfirm={async (remark) => {
          if (remarkMode === "verify") {
            await verifyMutation.mutateAsync(remark);
          } else if (remarkMode === "reject") {
            await rejectMutation.mutateAsync(remark);
          }
        }}
        onCancel={() => setRemarkMode(null)}
      />

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
}
