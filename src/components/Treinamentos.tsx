import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Search,
  Plus,
  Edit,
  Trash2Icon,
  CircleX,
  RotateCcw,
} from "lucide-react";

const treinamentos = [
  {
    id: 1,
    treinamento:
      "PRIMEIROS SOCORROS NA INDUSTRIA",
    tipo: "Formação",
    modalidade: "Presencial",
    status: 1,
  },
];

const Treinamentos = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Treinamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar usuários..."
              className="w-64 focus-visible:ring-gray-400"
            />
            <Button
              size="icon"
              variant="ghost"
              className="focus-visible:ring-transparent border-none"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button className="bg-white border border-gray-700 text-gray-700 hover:bg-gray-800 hover:text-white focus-visible:ring-gray-400">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Treinamento
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Treinamento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {treinamentos.map((user) => (
              <TableRow
                key={user.id}
                className={user.status === 0 ? "line-through" : ""}
              >
                <TableCell
                  className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                >
                  {user.treinamento}
                </TableCell>
                <TableCell className="py-2">{user.tipo}</TableCell>
                <TableCell className="py-2">{user.modalidade}</TableCell>
                <TableCell className="text-end py-2">
                  <Button
                    variant={"outline"}
                    className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {user.status === 1 ? (
                    <Button
                      variant={"outline"}
                      className="p-2 h-fit hover:bg-red-100 hover:border-red-200"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant={"outline"}
                      className="p-2 h-fit hover:bg-green-100 hover:border-green-200"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!treinamentos && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-8 w-8 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhum usuário encontrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Treinamentos;
