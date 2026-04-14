import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue>({
  open: false,
  setOpen: () => {},
});

function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useContext(DropdownContext);
  return (
    <button
      type="button"
      className={cn("", className)}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  children,
  className,
  align = "end",
  ...props
}: HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) {
  const { open } = useContext(DropdownContext);
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  children,
  className,
  onClick,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useContext(DropdownContext);
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
