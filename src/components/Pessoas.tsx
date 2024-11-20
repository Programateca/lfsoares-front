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
  Trash2Icon,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
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
import toast from "react-hot-toast";

interface Status {
  id: number;
  name: string;
}

interface Empresa {
  id: string;
  name: string;
}

interface Pessoa {
  id: string;
  name: string;
  cpf: string;
  status: Status;
  empresa: Empresa;
  matricula: string;
}

const Pessoas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pessoaInEditMode, setPessoaInEditMode] = useState<string | number>("");
  const [newPessoa, setNewPessoa] = useState({
    id: "",
    name: "",
    cpf: "",
    matricula: "",
    empresa: {
      id: "",
      name: "",
    },
  });
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const fetchPessoas = async () => {
    try {
      const response = await api.get("pessoas");
      setPessoas(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchPessoas();
      const response = await api.get("empresas");
      setEmpresas(response.data.data);
      setLoading(false);
    };

    inicializarFetch();
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
          name: newPessoa.name,
          cpf: newPessoa.cpf,
          matricula: newPessoa.matricula,
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
        toast.success("Pessoa atualizada com sucesso!");
        setNewPessoa({
          id: "",
          name: "",
          cpf: "",
          matricula: "",
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
        matricula: newPessoa.matricula,
        empresa: {
          id: newPessoa.empresa.id,
        },
      });

      fetchPessoas();
      setIsModalOpen(false);
      toast.success("Pessoa adicionada com sucesso!");
      setNewPessoa({
        id: "",
        name: "",
        cpf: "",
        matricula: "",
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
        matricula: pessoa.matricula,
        empresa: {
          id: pessoa.empresa.id,
          name: pessoa.empresa.name,
        },
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      await api.patch(`pessoas/${id}`, {
        status: {
          id: status,
        },
      });
      if (status === 1)
        toast("Pessoa ativado!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Pessoa inativado!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchPessoas();
    } catch (error) {}
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
              placeholder="Buscar pessoa..."
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
                  matricula: "",
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
                  <Label htmlFor="cpf">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="cpf"
                    value={newPessoa.cpf}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matricula (opcional)</Label>
                  <Input
                    id="matricula"
                    name="matricula"
                    type="matricula"
                    value={newPessoa.matricula}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa (opcional)</Label>
                  <Select
                    onValueChange={(value) => {
                      setNewPessoa((prev) => ({
                        ...prev,
                        empresa: {
                          id: value,
                          name:
                            empresas.find((empresa) => empresa.id === value)
                              ?.name || "",
                        },
                      }));
                    }}
                    value={newPessoa.empresa.id}
                  >
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
                          matricula: "",
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
              <TableHead>Matricula</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loader"></div>
                    <Loader2 className="text-lg mr-2 animate-spin text-gray-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : pessoas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhuma pessoa encontrada
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pessoas.map((pessoa) => (
                <TableRow
                  key={pessoa.id}
                  className={pessoa.status.id !== 1 ? "line-through" : ""}
                >
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
                    {pessoa.empresa?.name
                      ? pessoa.empresa.name
                      : "Não informada"}
                  </TableCell>
                  <TableCell className="py-2">{pessoa.matricula}</TableCell>
                  <TableCell className="py-2">
                    {pessoa.status.id === 1 ? "Ativo" : "Inativo"}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      onClick={() => handleEdit(pessoa.id)}
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                      disabled={pessoa.status.id !== 1}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {pessoa.status.id === 1 ? (
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
                              Tem certeza que deseja inativar essa pessoa?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Está ação podera ser revertida posteriormente. Mas
                              a pessoa não podera ser vinculada a nenhum layout
                              gerado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="w-20">
                              Não
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="w-20"
                              onClick={() => handleUpdateStatus(pessoa.id, 2)}
                            >
                              Sim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        onClick={() => handleUpdateStatus(pessoa.id, 1)}
                        variant={"outline"}
                        className="p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Pessoas;
