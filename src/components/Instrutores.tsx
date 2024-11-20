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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";
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
} from "./ui/alert-dialog";
import toast from "react-hot-toast";

interface Status {
  id: number;
  name: string;
}

interface Instrutor {
  id: string;
  name: string;
  qualificacaoProfissional: string;
  registroProfissional: string;
  status: Status;
}

const Instrutores = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [instrutorInEditMode, setInstrutorInEditMode] = useState<
    string | number
  >("");
  const [newInstrutor, setNewInstrutor] = useState({
    id: "",
    name: "",
    qualificacaoProfissional: "",
    registroProfissional: "",
  });
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);

  const fetchInstrutores = async () => {
    try {
      const response = await api.get("instrutores");
      setInstrutores(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchInstrutores();
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewInstrutor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (instrutorInEditMode) {
      try {
        await api.patch(`instrutores/${instrutorInEditMode}`, {
          name: newInstrutor.name,
          qualificacaoProfissional: newInstrutor.qualificacaoProfissional,
          registroProfissional: newInstrutor.registroProfissional,
        });

        fetchInstrutores();
        setIsModalOpen(false);
        toast.success("Instrutor atualizado com sucesso!");
        setNewInstrutor({
          id: "",
          name: "",
          qualificacaoProfissional: "",
          registroProfissional: "",
        });
        setInstrutorInEditMode("");
      } catch (error) {}
      return;
    }

    try {
      await api.post("instrutores", {
        name: newInstrutor.name,
        qualificacaoProfissional: newInstrutor.qualificacaoProfissional,
        registroProfissional: newInstrutor.registroProfissional,
      });
      fetchInstrutores();
      setIsModalOpen(false);
      toast.success("Instrutor adicionado com sucesso!");
      setNewInstrutor({
        id: "",
        name: "",
        qualificacaoProfissional: "",
        registroProfissional: "",
      });
    } catch (error) {}
  };

  const handleEdit = (id: string) => {
    setInstrutorInEditMode(id);
    setIsModalOpen(true);

    const instrutor = instrutores.find((instrutor) => instrutor.id === id);

    if (instrutor) {
      setNewInstrutor({
        id: instrutor.id,
        name: instrutor.name,
        qualificacaoProfissional: instrutor.qualificacaoProfissional,
        registroProfissional: instrutor.registroProfissional,
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      await api.patch(`instrutores/${id}`, {
        status: {
          id: status,
        },
      });
      if (status === 1)
        toast("Instrutor ativado!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Instrutor inativado!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchInstrutores();
    } catch (error) {}
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Instrutores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar instrutor..."
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
            onOpenChange={(isOpen) => {
              setIsModalOpen(isOpen);
              if (!isOpen) {
                setNewInstrutor({
                  id: "",
                  name: "",
                  registroProfissional: "",
                  qualificacaoProfissional: "",
                });
                setInstrutorInEditMode("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Instrutor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Instrutor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newInstrutor.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualificacaoProfissional">Qualificação profissional</Label>
                  <Input
                    id="qualificacaoProfissional"
                    name="qualificacaoProfissional"
                    value={newInstrutor.qualificacaoProfissional}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registroProfissional">Registro profissional</Label>
                  <Input
                    id="registroProfissional"
                    name="registroProfissional"
                    value={newInstrutor.registroProfissional}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setNewInstrutor({
                        id: "",
                        name: "",
                        registroProfissional: "",
                        qualificacaoProfissional: "",
                      });
                      setInstrutorInEditMode("");
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
              <TableHead>Nome Completo</TableHead>
              <TableHead>Qualificação profissional</TableHead>
              <TableHead>Registro profissional</TableHead>
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
            ) : instrutores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhum instrutor encontrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              instrutores.map((instrutor) => (
                <TableRow
                  key={instrutor.id}
                  className={instrutor.status.id !== 1 ? "line-through" : ""}
                >
                  <TableCell
                    className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                  >
                    {instrutor.name}
                  </TableCell>
                  <TableCell className="py-2">
                    {instrutor.qualificacaoProfissional}
                  </TableCell>
                  <TableCell className="py-2">
                    {instrutor.registroProfissional}
                  </TableCell>
                  <TableCell className="py-2">
                    {instrutor.status.id !== 2 ? "Ativo" : "Inativo"}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      onClick={() => handleEdit(instrutor.id)}
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                      disabled={instrutor.status.id !== 1}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {instrutor.status.id === 1 ? (
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
                              Tem certeza que deseja inativar este instrutor?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Está ação podera ser revertida posteriormente. Mas
                              o instrutor não poderá ser vinculado a novos
                              eventos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="w-20">
                              Não
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="w-20"
                              onClick={() =>
                                handleUpdateStatus(instrutor.id, 2)
                              }
                            >
                              Sim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        onClick={() => handleUpdateStatus(instrutor.id, 1)}
                        variant={"outline"}
                        className="p-2 h-fit hover:bg-green-100 hover:border-green-200"
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

export default Instrutores;
