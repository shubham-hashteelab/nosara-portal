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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types/enums";
import { capitalize } from "@/lib/utils";
import type { User } from "@/types/api";

const createSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  full_name: z.string().min(1, "Full name is required"),
  role: z.nativeEnum(UserRole),
});

const editSchema = z.object({
  username: z.string().min(1),
  password: z.string().optional(),
  full_name: z.string().min(1, "Full name is required"),
  role: z.nativeEnum(UserRole),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateForm | EditForm) => Promise<void>;
  user?: User | null;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const schema = isEdit ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateForm>({
    resolver: zodResolver(schema),
    values: user
      ? {
          username: user.username,
          password: "",
          full_name: user.full_name,
          role: user.role,
        }
      : { username: "", password: "", full_name: "", role: UserRole.INSPECTOR },
  });

  const handleFormSubmit = async (data: CreateForm) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              {...register("username")}
              disabled={isEdit}
            />
            {errors.username && (
              <p className="text-sm text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Password{isEdit ? " (leave blank to keep current)" : ""}
            </Label>
            <Input type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-red-500">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select {...register("role")}>
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>
                  {capitalize(r)}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
