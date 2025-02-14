import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2Icon,
  RotateCcw,
  Loader2,
  CircleX,
  BookUp2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface CustomTableProps<T extends { id: string | number }> {
  columns: Column[];
  data: T[];
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number, status: number) => void;
  onRestore?: (id: string | number, status: number) => void;
  onDownload?: (id: string | number, row: T) => void; // ✅ Nova prop para download
  loading?: boolean;
  searchable?: boolean;
  statusKey?: string;
  entityLabel?: string;
  deleteMessage?: string;
  restoreMessage?: string;
}

const getValue = (obj: any, key: string): any => {
  return key.split(".").reduce((o, i) => (o ? o[i] : ""), obj);
};

const CustomTable = <T extends { id: string | number }>({
  columns,
  data,
  onEdit,
  onDelete,
  onRestore,
  onDownload, // ✅ Nova prop para download
  loading = false,
  searchable = false,
  statusKey = "status.id",
  entityLabel = "Registro",
  deleteMessage = "Essa ação poderá ser revertida posteriormente.",
  restoreMessage = "Deseja realmente reativar este registro?",
}: CustomTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState<{
    id: string | number;
    status: number;
  } | null>(null);

  const handleSort = (column: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === column) {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(direction);
  };

  const filteredData = data
    .filter((item) =>
      columns.some((col) => {
        const value = getValue(item, col.key);
        return (
          typeof value === "string" &&
          value.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    )
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const valueA = getValue(a, sortColumn);
      const valueB = getValue(b, sortColumn);

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

  return (
    <>
      {searchable && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder={`Buscar ${entityLabel.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer"
              >
                {col.label}{" "}
                {sortColumn === col.key
                  ? sortDirection === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </TableHead>
            ))}
            <TableHead className="text-end">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center">
                <Loader2 className="animate-spin text-gray-500" />
              </TableCell>
            </TableRow>
          ) : filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center">
                <CircleX className="h-6 w-6 text-red-400" />
                <p className="text-sm text-red-400">
                  Nenhum {entityLabel.toLowerCase()} encontrado
                </p>
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((item) => (
              <TableRow
                key={item.id}
                className={
                  !onDownload && getValue(item, statusKey) !== 1
                    ? "line-through"
                    : ""
                }
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="whitespace-nowrap">
                    {col.render
                      ? col.render(getValue(item, col.key), item)
                      : getValue(item, col.key)}
                  </TableCell>
                ))}
                <TableCell className="text-end space-x-2 whitespace-nowrap">
                  {onEdit && (
                    <Button
                      onClick={() => onEdit(item.id)}
                      variant="outline"
                      className="p-2 h-fit"
                      disabled={!onDownload && getValue(item, statusKey) !== 1}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {onDownload && ( // ✅ Mostra o botão de download se `onDownload` for fornecido
                    <Button
                      onClick={() => onDownload(item.id, item)}
                      variant="outline"
                      className="p-2 h-fit hover:bg-gray-200"
                    >
                      <BookUp2 className="h-4 w-4" />
                      Baixar Documento
                    </Button>
                  )}

                  {onDelete && getValue(item, statusKey) !== 2 ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="p-2 h-fit hover:bg-red-100 hover:border-red-200"
                          onClick={() =>
                            setSelectedItem({ id: item.id, status: 2 })
                          }
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Inativar {entityLabel}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {deleteMessage}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="w-20">
                            Não
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="w-20"
                            onClick={() => {
                              if (selectedItem)
                                onDelete &&
                                  onDelete(
                                    selectedItem.id,
                                    selectedItem.status
                                  );
                              setSelectedItem(null);
                            }}
                          >
                            Sim
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    onRestore && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                            onClick={() =>
                              setSelectedItem({ id: item.id, status: 1 })
                            }
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Reativar {entityLabel}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {restoreMessage}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="w-20">
                              Não
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="w-20"
                              onClick={() => {
                                if (selectedItem)
                                  onRestore!(
                                    selectedItem.id,
                                    selectedItem.status
                                  );
                                setSelectedItem(null);
                              }}
                            >
                              Sim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default CustomTable;
