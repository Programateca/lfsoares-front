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
import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { api } from "@/lib/axios";

interface Role {
  id: number;
  name: string;
}

interface Status {
  id: number;
  name: string;
}

interface User {
  id: number;
  email: string;
  provider: string;
  socialId: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  status: Status;
}

const Usuarios = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInEditMode, setUserInEditMode] = useState<string | number>("");
  const [newUser, setNewUser] = useState({
    id: 0,
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("users");
      setUsers(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = users.find((user) => user.id === newUser.id);

    if (userInEditMode) {
      try {
        await api.patch(`users/${userInEditMode}`, {
          firstName: newUser.name,
          email:
            newUser.email === user?.email || newUser.email === ""
              ? null
              : newUser.email,
          password: newUser.password ? newUser.password : null,
        });

        fetchUsers();
        setIsModalOpen(false);
        setNewUser({
          id: 0,
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setUserInEditMode("");
      } catch (error) {}
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      return console.log("Senhas não conferem");
    }

    try {
      await api.post("users", {
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.name,
        lastName: ".",
        role: { id: 1, name: "User" },
        status: { id: 1, name: "Ativo" },
      });

      fetchUsers();
      setIsModalOpen(false);
      setNewUser({
        id: 0,
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {}
  };

  const handleEditUser = (id: number) => {
    setUserInEditMode(id);
    setIsModalOpen(true);

    const user = users.find((user) => user.id === id);

    if (user) {
      setNewUser({
        id: user.id,
        name: user.firstName,
        email: user.email,
        password: "",
        confirmPassword: "",
      });
    }
  };

  const handleUpdateStatusUser = async (id: number, status: number) => {
    try {
      await api.patch(`users/${id}`, {
        status: {
          id: status,
        },
      });

      fetchUsers();
    } catch (error) {}
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
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open)
                setNewUser({
                  id: 0,
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                });
              setUserInEditMode("");
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar novo usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required={userInEditMode ? false : true}
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
                    required={userInEditMode ? false : true}
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
                    required={userInEditMode ? false : true}
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
                    required={userInEditMode ? false : true}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false),
                        setNewUser({
                          id: 0,
                          name: "",
                          email: "",
                          password: "",
                          confirmPassword: "",
                        });
                      setUserInEditMode("");
                    }}
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
            {users &&
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.status.id !== 1 ? "line-through" : ""}
                >
                  <TableCell className="font-medium py-2">
                    {user.firstName}
                  </TableCell>
                  <TableCell className="py-2">{user.email}</TableCell>
                  <TableCell className="py-2">
                    {user.status.id !== 2 ? "Ativo" : "Inativo"}
                  </TableCell>
                  <TableCell className="py-2 text-end">
                    <Button
                      onClick={() => handleEditUser(user.id)}
                      variant={"outline"}
                      className={`mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200
                      disabled:opacity-75 disabled:cursor-not-allowed
                      `}
                      disabled={user.status.id !== 1}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.status.id !== 2 ? (
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <Button
                            variant={"outline"}
                            className="p-2 h-fit hover:bg-red-100 hover:border-red-200"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Tem certeza que deseja inativar este usuário?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Está ação podera ser revertida posteriormente. Mas
                              o usuário não poderá acessar o sistema enquanto
                              estiver inativo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="w-20">
                              Não
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="w-20"
                              onClick={() => handleUpdateStatusUser(user.id, 2)}
                            >
                              Sim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        onClick={() => handleUpdateStatusUser(user.id, 1)}
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
