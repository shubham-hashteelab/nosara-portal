import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue>({
  open: false,
  setOpen: () => {},
});

interface SheetProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Sheet({ children, open: controlledOpen, onOpenChange }: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setInternalOpen(v);
  };

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useContext(SheetContext);
  return (
    <button
      type="button"
      className={cn("", className)}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

function SheetContent({
  children,
  className,
  side = "left",
  ...props
}: HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }) {
  const { open, setOpen } = useContext(SheetContext);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-white shadow-xl transition-transform",
          side === "left" ? "left-0" : "right-0",
          "w-72",
          className
        )}
        {...props}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  );
}

export { Sheet, SheetTrigger, SheetContent };
