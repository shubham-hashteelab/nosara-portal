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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Trade, UserRole } from "@/types/enums";
import { capitalize } from "@/lib/utils";
import type { User, UserCreate, UserUpdate } from "@/types/api";

const roleEnum = z.enum(Object.values(UserRole) as [string, ...string[]]);

const baseSchema = z.object({
  username: z.string().min(1, "Username is required"),
  full_name: z.string().min(1, "Full name is required"),
  role: roleEnum,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  trades: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

const createSchema = baseSchema
  .extend({
    password: z.string().min(4, "Password must be at least 4 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.role === UserRole.CONTRACTOR) {
      if (!data.trades || data.trades.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trades"],
          message: "At least one trade is required for a Business Associate",
        });
      }
    }
  });

const editSchema = baseSchema
  .extend({
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === UserRole.CONTRACTOR) {
      if (!data.trades || data.trades.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trades"],
          message: "At least one trade is required for a Business Associate",
        });
      }
    }
  });

type FormValues = z.infer<typeof createSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UserCreate | UserUpdate) => Promise<void>;
  user?: User | null;
  /**
   * When set, the role selector is pre-filled and locked. Used by the
   * Business Associates page where all created users are CONTRACTOR.
   */
  lockedRole?: string;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
  lockedRole,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const schema = isEdit ? editSchema : createSchema;

  const contractorLabel = "Business Associate";

  const defaultValues: Partial<FormValues> = user
    ? {
        username: user.username,
        password: "",
        full_name: user.full_name,
        role: user.role,
        email: user.email ?? "",
        phone: user.phone ?? "",
        company: user.company ?? "",
        trades: user.trades ?? [],
        is_active: user.is_active,
      }
    : {
        username: "",
        password: "",
        full_name: "",
        role: lockedRole ?? UserRole.INSPECTOR,
        email: "",
        phone: "",
        company: "",
        trades: [],
        is_active: true,
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as FormValues,
  });

  // Reset the form when the dialog is reopened for a different target.
  useEffect(() => {
    if (open) {
      reset(defaultValues as FormValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const role = watch("role");
  const trades = watch("trades") ?? [];
  const showContractorFields = role === UserRole.CONTRACTOR;

  const toggleTrade = (trade: string) => {
    const current = trades.includes(trade)
      ? trades.filter((t) => t !== trade)
      : [...trades, trade];
    setValue("trades", current, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: FormValues) => {
    const isContractor = data.role === UserRole.CONTRACTOR;

    const commonFields = {
      email: data.email ? data.email : null,
      phone: data.phone ? data.phone : null,
    };

    if (isEdit) {
      const payload: UserUpdate = {
        full_name: data.full_name,
        ...commonFields,
      };
      if (data.password) payload.password = data.password;
      if (typeof data.is_active === "boolean") payload.is_active = data.is_active;
      if (isContractor) {
        payload.trades = data.trades ?? [];
        payload.company = data.company ? data.company : null;
      }
      await onSubmit(payload);
    } else {
      const payload: UserCreate = {
        username: data.username,
        password: data.password!,
        full_name: data.full_name,
        role: data.role as UserCreate["role"],
        ...commonFields,
      };
      if (isContractor) {
        payload.trades = data.trades ?? [];
        payload.company = data.company ? data.company : null;
      }
      await onSubmit(payload);
    }

    reset();
    onOpenChange(false);
  };

  const dialogTitle = isEdit
    ? lockedRole === UserRole.CONTRACTOR
      ? `Edit ${contractorLabel}`
      : "Edit User"
    : lockedRole === UserRole.CONTRACTOR
      ? `Add ${contractorLabel}`
      : "Create User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input {...register("username")} disabled={isEdit} />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Password{isEdit ? " (leave blank to keep current)" : ""}
            </Label>
            <Input type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select {...register("role")} disabled={!!lockedRole}>
              {Object.values(UserRole)
                .filter(
                  // Business Associates are created from the dedicated page;
                  // hiding CONTRACTOR here prevents managers creating one
                  // that would then vanish from the filtered Users table.
                  (r) => lockedRole || r !== UserRole.CONTRACTOR
                )
                .map((r) => (
                  <option key={r} value={r}>
                    {r === UserRole.CONTRACTOR ? contractorLabel : capitalize(r)}
                  </option>
                ))}
            </Select>
            {!lockedRole && (
              <p className="text-xs text-gray-500">
                To create a Business Associate, use the Business Associates page.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input {...register("phone")} />
            </div>
          </div>

          {showContractorFields && (
            <>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input {...register("company")} />
              </div>

              <div className="space-y-2">
                <Label>Trades</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  {Object.values(Trade).map((t) => {
                    const checked = trades.includes(t);
                    return (
                      <label
                        key={t}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTrade(t)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        {capitalize(t)}
                      </label>
                    );
                  })}
                </div>
                {errors.trades && (
                  <p className="text-sm text-red-500">
                    {errors.trades.message as string}
                  </p>
                )}
              </div>
            </>
          )}

          {isEdit && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input
                id="is_active"
                type="checkbox"
                {...register("is_active")}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Label htmlFor="is_active" className="m-0">
                Active
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
