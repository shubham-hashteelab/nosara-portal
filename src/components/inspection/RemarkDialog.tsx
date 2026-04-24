import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const schema = z.object({
  remark: z.string().min(1, "Remark is required"),
});

type FormValues = z.infer<typeof schema>;

interface RemarkDialogProps {
  open: boolean;
  mode: "verify" | "reject";
  entryName: string;
  pending: boolean;
  onConfirm: (remark: string) => Promise<void> | void;
  onCancel: () => void;
}

export function RemarkDialog({
  open,
  mode,
  entryName,
  pending,
  onConfirm,
  onCancel,
}: RemarkDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { remark: "" },
  });

  useEffect(() => {
    if (open) reset({ remark: "" });
  }, [open, reset]);

  const submit = (data: FormValues) => onConfirm(data.remark);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "verify" ? "Verify Fix" : "Reject Fix"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">
          {mode === "verify"
            ? `Confirm the fix for "${entryName}" and add a verification remark.`
            : `Reject the fix for "${entryName}" and tell the Business Associate what to redo.`}
        </p>
        <form onSubmit={handleSubmit(submit)} className="space-y-3 mt-3">
          <div className="space-y-2">
            <Label>
              {mode === "verify"
                ? "Verification remark"
                : "Rejection remark"}
            </Label>
            <Textarea rows={4} {...register("remark")} />
            {errors.remark && (
              <p className="text-sm text-red-500">{errors.remark.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === "verify" ? "default" : "destructive"}
              disabled={pending}
            >
              {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "verify" ? "Verify" : "Reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
