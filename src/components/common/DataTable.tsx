import { useState, useMemo, type ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "./EmptyState";
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  accessor?: (item: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  getRowKey: (item: T) => string | number;
}

export function DataTable<T>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search...",
  pageSize = 10,
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search) return data;
    const term = search.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = col.accessor
          ? col.accessor(item)
          : (item as Record<string, unknown>)[col.key];
        return String(val ?? "")
          .toLowerCase()
          .includes(term);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = col.accessor
        ? col.accessor(a)
        : (a as Record<string, unknown>)[col.key];
      const bVal = col.accessor
        ? col.accessor(b)
        : (b as Record<string, unknown>)[col.key];
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
      )}

      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((col) => (
                <TableHead key={col.key}>
                  {col.sortable ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-gray-900"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    title="No results"
                    description={
                      search
                        ? "No items match your search."
                        : "No items to display."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((item) => (
                <TableRow
                  key={getRowKey(item)}
                  className={
                    onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                  }
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(item)
                        : String(
                            (item as Record<string, unknown>)[col.key] ?? ""
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {page * pageSize + 1} to{" "}
            {Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}{" "}
            results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
