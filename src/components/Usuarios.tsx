import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";

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
  name: string;
  role: Role;
  status: Status;
}

const Usuarios = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInEditMode, setUserInEditMode] = useState<string | number>("");
  const [newUser, setNewUser] = useState({
    id: 0,
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const fetchUsers = async (pageNumber: number = 1, search = "") => {
    try {
      setLoading(true);

      const response = await api.get("users", {
        params: {
          page: pageNumber,
          limit,
          search,
        },
      });
      setUsers(response.data.data);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    // Se for avançar e não houver próxima página, interrompe a navegação
    if (newPage > page && !hasNextPage) {
      toast.error("Não há registros para esta página.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("users", {
        params: { page: newPage, limit },
      });

      setUsers(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar usuários");
    } finally {
      setLoading(false);
    }
  };

  // Efeito para busca com debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length >= 3) {
        // Quando o usuário digitar pelo menos 3 letras, reseta a página e busca
        setPage(1);
        fetchUsers(1, searchQuery);
      } else {
        // Se o termo tiver menos de 3 letras, busca sem filtro ou limpa os resultados, conforme sua lógica
        fetchUsers(page);
      }
    }, 300); // tempo de debounce: 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers(page, searchQuery.length >= 3 ? searchQuery : "");
  }, [page]);

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePassword = (password: string) => {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(newUser.email)) {
      return toast.error("Email inválido. Certifique-se de que contém '@'.");
    }

    if (!userInEditMode && !validatePassword(newUser.password)) {
      return toast.error(
        "A senha deve ter pelo menos 6 caracteres, incluindo letras e números."
      );
    }

    if (newUser.password !== newUser.confirmPassword) {
      return toast.error("As senhas não coincidem");
    }

    const user = users.find((user) => user.id === newUser.id);

    if (userInEditMode) {
      try {
        await api.patch(`users/${userInEditMode}`, {
          name: newUser.name,
          email:
            newUser.email === user?.email || newUser.email === ""
              ? null
              : newUser.email,
          password: newUser.password ? newUser.password : null,
        });

        fetchUsers();
        setIsModalOpen(false);
        toast.success("Usuário atualizado com sucesso");
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

    try {
      await api.post("users", {
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        role: { id: 1, name: "User" },
        status: { id: 1, name: "Ativo" },
      });

      fetchUsers();
      setIsModalOpen(false);
      toast.success("Usuário cadastrado com sucesso");
      setNewUser({
        id: 0,
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {}
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                setNewUser({
                  id: 0,
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                });
                setUserInEditMode("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {userInEditMode ? "Editar Usuário" : "Adicionar novo usuário"}
                </DialogTitle>
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
                    required={!userInEditMode}
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
                    required={!userInEditMode}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
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
                  <Button type="submit">
                    {userInEditMode ? "Salvar Alterações" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CustomTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "email", label: "Email" },
            { key: "status.name", label: "Status" },
          ]}
          data={users}
          onEdit={(id) => {
            setUserInEditMode(id);
            setIsModalOpen(true);
            const user = users.find((user) => user.id === id);
            if (user) {
              setNewUser({
                id: user.id,
                name: user.name,
                email: user.email,
                password: "",
                confirmPassword: "",
              });
            }
          }}
          onDelete={() => {}}
          onRestore={() => {}}
          loading={loading}
          entityLabel="Usuário"
          searchable
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          hasNextPage={hasNextPage}
          page={page}
          onPageChange={handlePageChange}
        />
      </CardContent>
    </Card>
  );
};

export default Usuarios;
