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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { useState } from "react";

const pessoas = [
  {
    id: 1,
    nome: "Alice Johnson",
    cpf: "123.456.789-00",
    empresa: "Empresa A",
    status: 1,
  },
  {
    id: 2,
    nome: "Bob Smith",
    cpf: "123.456.789-00",
    empresa: "",
    status: 1,
  },
];

const Pessoas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: "",
    cpf: "",
    empresa: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New user data:", newUser);
    setIsModalOpen(false);
    setNewUser({
      nome: "",
      cpf: "",
      empresa: "",
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Pessoas</CardTitle>
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
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Pessoa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar nova pessoa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newUser.nome}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">CPF</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newUser.cpf}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Empresa</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newUser.empresa}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pessoas.map((user) => (
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
                  {user.nome}
                </TableCell>
                <TableCell className="py-2">{user.cpf}</TableCell>
                <TableCell className="py-2">
                  {user.empresa ? user.empresa : "Não informada"}
                </TableCell>
                <TableCell className="py-2">
                  {user.status === 1 ? "Ativo" : "Inativo"}
                </TableCell>
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
            {!pessoas && (
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

export default Pessoas;
