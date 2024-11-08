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
  CircleX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";

interface Pessoa {
  id: string;
  name: string;
  cpf: string;
  empresa: {
    id: string;
    name: string;
  };
}

interface Empresa {
  id: string;
  name: string;
}

const Pessoas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pessoaInEditMode, setPessoaInEditMode] = useState<string | number>("");
  const [newPessoa, setNewPessoa] = useState({
    id: "",
    name: "",
    cpf: "",
    empresa: {
      id: "",
      name: "",
    },
  });
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  console.log(newPessoa);
  const fetchPessoas = async () => {
    try {
      const response = await api.get("pessoas");
      setPessoas(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchPessoas();
    api.get("empresas").then((response) => setEmpresas(response.data.data));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPessoa((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pessoa = pessoas.find((pessoa) => pessoa.id === newPessoa.id);

    if (pessoaInEditMode) {
      try {
        await api.patch(`pessoas/${pessoaInEditMode}`, {
          name:
            newPessoa.name === pessoa?.name || newPessoa.name === ""
              ? null
              : newPessoa.name,
          cpf:
            newPessoa.cpf === pessoa?.cpf || newPessoa.cpf === ""
              ? null
              : newPessoa.cpf,
          empresa: {
            id:
              newPessoa.empresa.id === pessoa?.empresa.id ||
              newPessoa.empresa.id === ""
                ? null
                : newPessoa.empresa.id,
          },
        });

        fetchPessoas();
        setIsModalOpen(false);
        setNewPessoa({
          id: "",
          name: "",
          cpf: "",
          empresa: {
            id: "",
            name: "",
          },
        });
        setPessoaInEditMode("");
      } catch (error) {}
      return;
    }

    try {
      await api.post("pessoas", {
        name: newPessoa.name,
        cpf: newPessoa.cpf,
        empresa: {
          id: newPessoa.empresa.id,
        },
      });

      fetchPessoas();
      setIsModalOpen(false);
      setNewPessoa({
        id: "",
        name: "",
        cpf: "",
        empresa: {
          id: "",
          name: "",
        },
      });
    } catch (error) {}
  };

  const handleEdit = (id: string) => {
    setPessoaInEditMode(id);
    setIsModalOpen(true);
    const pessoa = pessoas.find((pessoa) => pessoa.id === id);

    if (pessoa) {
      setNewPessoa({
        id: pessoa.id,
        name: pessoa.name,
        cpf: pessoa.cpf,
        empresa: {
          id: pessoa.empresa.id,
          name: pessoa.empresa.name,
        },
      });
    }
  };

  // const handleUpdateStatus = async (id: number, status: number) => {
  //   try {
  //     await api.patch(`users/${id}`, {
  //       status: {
  //         id: status,
  //       },
  //     });

  //     fetchPessoas();
  //   } catch (error) {}
  // };

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
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open)
                setNewPessoa({
                  id: "",
                  name: "",
                  cpf: "",
                  empresa: {
                    id: "",
                    name: "",
                  },
                });
            }}
          >
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
                    value={newPessoa.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="cpf"
                    value={newPessoa.cpf}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select onValueChange={
                    (value) => {
                      setNewPessoa((prev) => ({
                        ...prev,
                        empresa: {
                          id: value,
                          name: empresas.find((empresa) => empresa.id === value)?.name || "",
                        },
                      }));
                    }
                  }>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Empresas:</SelectLabel>
                        {empresas.map((empresa) => {
                          return (
                            <SelectItem key={empresa.id} value={empresa.id}>
                              {empresa.name}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false),
                        setNewPessoa({
                          id: "",
                          name: "",
                          cpf: "",
                          empresa: {
                            id: "",
                            name: "",
                          },
                        });
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
              <TableHead>CPF</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pessoas.map((pessoa) => (
              <TableRow key={pessoa.id}>
                <TableCell
                  className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                >
                  {pessoa.name}
                </TableCell>
                <TableCell className="py-2">{pessoa.cpf}</TableCell>
                <TableCell className="py-2">
                  {pessoa.empresa?.name ? pessoa.empresa.name : "Não informada"}
                </TableCell>
                {/* <TableCell className="py-2">
                  {user.status === 1 ? "Ativo" : "Inativo"}
                </TableCell> */}
                <TableCell className="text-end py-2">
                  <Button
                    onClick={() => handleEdit(pessoa.id)}
                    variant={"outline"}
                    className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* {user.status === 1 ? (
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
                  )} */}
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
