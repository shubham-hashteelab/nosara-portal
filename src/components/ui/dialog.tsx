import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({
  open: false,
  setOpen: () => {},
});

interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
      if (controlledOpen === undefined) {
        setInternalOpen(value);
      }
    },
    [onOpenChange, controlledOpen]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children, ...props }: HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useContext(DialogContext);
  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

function DialogContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useContext(DialogContext);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) setOpen(false);
      }}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto",
          className
        )}
        {...props}
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-gray-500", className)} {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
