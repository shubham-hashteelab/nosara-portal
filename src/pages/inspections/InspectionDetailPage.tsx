import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getInspectionEntry, updateInspectionEntry } from "@/api/inspections";
import {
  listContractors,
  assignContractorToSnag,
  unassignContractorFromSnag,
} from "@/api/contractors";
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
import {
  ArrowLeft,
  Save,
  UserPlus,
  X,
  Image as ImageIcon,
  Mic,
} from "lucide-react";
import { capitalize, formatDateTime } from "@/lib/utils";
import {
  CheckStatus,
  Severity,
  SnagFixStatus,
} from "@/types/enums";

const updateSchema = z.object({
  check_status: z.nativeEnum(CheckStatus),
  severity: z.nativeEnum(Severity).nullable(),
  snag_fix_status: z.nativeEnum(SnagFixStatus).nullable(),
  notes: z.string().nullable(),
});

type UpdateForm = z.infer<typeof updateSchema>;

export default function InspectionDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const entryIdNum = entryId!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContractor, setSelectedContractor] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: entry, isLoading } = useQuery({
    queryKey: ["inspection", entryIdNum],
    queryFn: () => getInspectionEntry(entryIdNum),
  });

  const { data: contractors } = useQuery({
    queryKey: ["contractors"],
    queryFn: listContractors,
  });

  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    values: entry
      ? {
          check_status: entry.check_status,
          severity: entry.severity,
          snag_fix_status: entry.snag_fix_status,
          notes: entry.notes,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateForm) =>
      updateInspectionEntry(entryIdNum, {
        check_status: data.check_status,
        severity: data.severity,
        snag_fix_status: data.snag_fix_status,
        notes: data.notes,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inspection", entryIdNum] }),
  });

  const assignMutation = useMutation({
    mutationFn: (contractorId: string) =>
      assignContractorToSnag(entryIdNum, contractorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inspection", entryIdNum] }),
  });

  const unassignMutation = useMutation({
    mutationFn: unassignContractorFromSnag,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inspection", entryIdNum] }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!entry) return <div>Entry not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {entry.checklist_item}
          </h1>
          <p className="text-sm text-gray-500">
            {entry.room_label} — {capitalize(entry.category)} — Entry #{entry.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={entry.check_status} />
          <SeverityBadge severity={entry.severity} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Update form */}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Check Status</Label>
                    <Select {...form.register("check_status")}>
                      {Object.values(CheckStatus).map((s) => (
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
                        form.setValue(
                          "severity",
                          e.target.value
                            ? (e.target.value as Severity)
                            : null
                        )
                      }
                    >
                      <option value="">None</option>
                      {Object.values(Severity).map((s) => (
                        <option key={s} value={s}>
                          {capitalize(s)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fix Status</Label>
                    <Select
                      value={form.watch("snag_fix_status") ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "snag_fix_status",
                          e.target.value
                            ? (e.target.value as SnagFixStatus)
                            : null
                        )
                      }
                    >
                      <option value="">None</option>
                      {Object.values(SnagFixStatus).map((s) => (
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
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
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

          {/* Photos */}
          {entry.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Photos ({entry.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {entry.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={getMediaUrl(img.minio_key)}
                        alt={img.caption ?? "Snag photo"}
                        className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:ring-2 hover:ring-primary-500"
                        onClick={() =>
                          setLightboxImage(getMediaUrl(img.minio_key))
                        }
                      />
                      {img.caption && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                      {vn.duration_seconds
                        ? `${vn.duration_seconds}s`
                        : ""}
                    </div>
                  </div>
                ))}
                {entry.voice_notes.some((vn) => vn.transcript) && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Transcripts
                    </p>
                    {entry.voice_notes
                      .filter((vn) => vn.transcript)
                      .map((vn) => (
                        <p
                          key={vn.id}
                          className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-1"
                        >
                          {vn.transcript}
                        </p>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Info & Contractors */}
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
                <span className="text-gray-500">Inspector</span>
                <span className="font-medium">
                  {entry.inspector_name ?? "Unassigned"}
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

          {/* Contractor assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contractors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entry.contractor_assignments.map((ca) => (
                <div
                  key={ca.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {ca.contractor_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Assigned {formatDateTime(ca.assigned_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ca.resolved_at && (
                      <Badge variant="success">Resolved</Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => unassignMutation.mutate(ca.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <Select
                  className="flex-1"
                  value={selectedContractor}
                  onChange={(e) => setSelectedContractor(e.target.value)}
                >
                  <option value="">Select contractor...</option>
                  {contractors?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.trade})
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  disabled={
                    !selectedContractor || assignMutation.isPending
                  }
                  onClick={() => {
                    assignMutation.mutate(selectedContractor);
                    setSelectedContractor("");
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
