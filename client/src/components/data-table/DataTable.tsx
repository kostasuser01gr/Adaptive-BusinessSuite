import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableToolbar } from "./DataTableToolbar";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  enableRowSelection?: boolean;
  enableVirtualization?: boolean;
  bulkActions?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Global fuzzy/includes filter across all columns */
function globalFilterFn<TData>(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: string
): boolean {
  const value = row.getValue(columnId);
  if (value == null) return false;
  return String(value).toLowerCase().includes(filterValue.toLowerCase());
}

// ---------------------------------------------------------------------------
// Sort indicator
// ---------------------------------------------------------------------------

function SortIndicator({ column }: { column: { getIsSorted: () => false | "asc" | "desc" } }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUpIcon className="ml-1 inline size-3.5" />;
  if (sorted === "desc")
    return <ArrowDownIcon className="ml-1 inline size-3.5" />;
  return <ArrowUpDownIcon className="ml-1 inline size-3.5 text-muted-foreground/50" />;
}

// ---------------------------------------------------------------------------
// Row animation variants
// ---------------------------------------------------------------------------

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.02, 0.3), duration: 0.2 },
  }),
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<TData, TValue>({
  columns: userColumns,
  data,
  searchPlaceholder,
  onRowClick,
  pageSize = 25,
  enableRowSelection = false,
  enableVirtualization = false,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  // ---- State ----
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // ---- Prepend selection column when enabled ----
  const columns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableRowSelection) return userColumns as ColumnDef<TData, unknown>[];

    const selectionCol: ColumnDef<TData, unknown> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    };

    return [selectionCol, ...(userColumns as ColumnDef<TData, unknown>[])];
  }, [userColumns, enableRowSelection]);

  // ---- Table instance ----
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableMultiSort: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  // ---- Virtual scrolling ----
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
    enabled: enableVirtualization,
  });

  const virtualRows = enableVirtualization
    ? virtualizer.getVirtualItems()
    : null;

  // ---- Render ----
  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={searchPlaceholder}
        bulkActions={bulkActions}
      />

      {/* Table */}
      <div
        ref={tableContainerRef}
        className={cn(
          "rounded-lg border",
          enableVirtualization && "max-h-[600px] overflow-auto"
        )}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className={cn(
                      header.column.getCanSort() &&
                        "cursor-pointer select-none"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="flex items-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <SortIndicator column={header.column} />
                        )}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {enableVirtualization && virtualRows ? (
              <>
                {virtualRows.length > 0 && virtualRows[0].start > 0 && (
                  <tr style={{ height: virtualRows[0].start }} />
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={cn(onRowClick && "cursor-pointer")}
                      onClick={() => onRowClick?.(row.original)}
                      style={{ height: virtualRow.size }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {virtualRows.length > 0 &&
                  virtualizer.getTotalSize() -
                    (virtualRows[virtualRows.length - 1].start +
                      virtualRows[virtualRows.length - 1].size) >
                    0 && (
                    <tr
                      style={{
                        height:
                          virtualizer.getTotalSize() -
                          (virtualRows[virtualRows.length - 1].start +
                            virtualRows[virtualRows.length - 1].size),
                      }}
                    />
                  )}
              </>
            ) : (
              <AnimatePresence mode="popLayout">
                {rows.length > 0 ? (
                  rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
}
