import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { Label } from "./ui/label";

const users = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", status: 1 },
  { id: 2, name: "Bob Smith", email: "bob@example.com", status: 1 },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol@example.com",
    status: 1,
  },
  { id: 4, name: "David Brown", email: "david@example.com", status: 1 },
  { id: 5, name: "Eva Davis", email: "eva@example.com", status: 0 },
  { id: 6, name: "Frank Wilson", email: "frank@example.com", status: 1 },
  { id: 7, name: "Grace Lee", email: "grace@example.com", status: 0 },
  { id: 8, name: "Henry Campbell", email: "henry@example.com", status: 0 },
];

const Usuarios = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the form submission,
    // such as sending the data to an API
    console.log("New user data:", newUser);
    setIsModalOpen(false);
    setNewUser({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar usuários..."
              className="w-64 focus-visible:ring-gray-400"
            />
            <Button size="icon" variant="ghost">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={newUser.confirmPassword}
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
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className={user.status === 0 ? "line-through" : ""}
              >
                <TableCell className="font-medium py-2">{user.name}</TableCell>
                <TableCell className="py-2">{user.email}</TableCell>
                <TableCell className="py-2">
                  {user.status === 1 ? "Ativo" : "Inativo"}
                </TableCell>
                <TableCell className="py-2 text-end">
                  <Button
                    variant={"outline"}
                    className={`mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200
                      disabled:opacity-75 disabled:cursor-not-allowed
                      `}
                    disabled={user.status === 0}
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
            {!users && (
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

export default Usuarios;
