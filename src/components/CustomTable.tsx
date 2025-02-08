import { useState } from "react";
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
import { Edit, Trash2Icon, RotateCcw, Loader2, CircleX } from "lucide-react";
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

interface Column<T> {
  key: string;
  label: string;
}

interface CustomTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit: (id: number) => void;
  onDelete: (id: number, status: number) => void;
  onRestore?: (id: number, status: number) => void;
  loading?: boolean;
  searchable?: boolean;
  statusKey?: string;
  entityLabel?: string; // Nome da entidade para exibir no modal (ex: "Usuário", "Produto", "Pedido")
  deleteMessage?: string; // Mensagem personalizada para inativação
  restoreMessage?: string; // Mensagem personalizada para reativação
}

const getValue = (obj: any, key: string): any => {
  return key.split(".").reduce((o, i) => (o ? o[i] : ""), obj);
};

const CustomTable = <T extends { id: number }>({
  columns,
  data,
  onEdit,
  onDelete,
  onRestore,
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
    id: number;
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
      {/* Campo de busca */}
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
                  getValue(item, statusKey) !== 1 ? "line-through" : ""
                }
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {String(getValue(item, col.key))}
                  </TableCell>
                ))}
                <TableCell className="text-end space-x-2">
                  <Button
                    onClick={() => onEdit(item.id)}
                    variant="outline"
                    className="p-2 h-fit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {getValue(item, statusKey) !== 2 ? (
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
                                onDelete(selectedItem.id, selectedItem.status);
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
