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
  Plus,
  Edit,
  Trash2Icon,
  CircleX,
  RotateCcw,
  Loader2,
} from "lucide-react";
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
} from "./ui/alert-dialog";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";
import toast from "react-hot-toast";

interface Status {
  id: number;
  name: string;
}

interface Treinamento {
  name: string;
  courseModality: string;
  courseMethodology: string;
  courseType: string;
  courseValidaty: string;
  courseHours: string;
  coursePortaria: string;
  id: string;
  status: Status;
}

const Treinamentos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [treinamentoInEditMode, setTreinamentoInEditMode] = useState<
    string | number
  >("");
  const [newTreinamento, setNewTreinamento] = useState({
    name: "",
    courseModality: "",
    courseMethodology: "",
    courseType: "",
    courseValidaty: "",
    courseHours: "",
    coursePortaria: "",
  });
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);

  const fetchTreinamentos = async () => {
    try {
      const response = await api.get("treinamentos");
      console.log(response.data.data);
      setTreinamentos(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchTreinamentos();
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const clearForm = () => {
    setNewTreinamento({
      name: "",
      courseModality: "",
      courseMethodology: "",
      courseType: "",
      courseValidaty: "",
      courseHours: "",
      coursePortaria: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(name, value);
    setNewTreinamento((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (treinamentoInEditMode) {
      try {
        await api.patch(`treinamentos/${treinamentoInEditMode}`, {
          name: newTreinamento.name,
          courseModality: newTreinamento.courseModality,
          courseType: newTreinamento.courseType,
          courseMethodology: newTreinamento.courseMethodology,
          courseValidaty: newTreinamento.courseValidaty,
          courseHours: newTreinamento.courseHours,
          coursePortaria: newTreinamento.coursePortaria,
        });

        fetchTreinamentos();
        setIsModalOpen(false);
        toast.success("Treinamento atualizado com sucesso!");
        clearForm();
      } catch (error) {
        toast.error("Erro ao atualizar treinamento");
      }
      return;
    }

    try {
      await api.post("treinamentos", {
        name: newTreinamento.name,
        courseModality: newTreinamento.courseModality,
        courseType: newTreinamento.courseType,
        courseMethodology: newTreinamento.courseMethodology,
        courseValidaty: newTreinamento.courseValidaty,
        courseHours: newTreinamento.courseHours,
        coursePortaria: newTreinamento.coursePortaria,
      });

      console.log(newTreinamento);

      fetchTreinamentos();
      setIsModalOpen(false);
      toast.success("Treinamento adicionado com sucesso!");
      clearForm();
    } catch (error) {}
  };

  const handleEdit = (id: string) => {
    setTreinamentoInEditMode(id);
    setIsModalOpen(true);

    const treinamento = treinamentos.find(
      (treinamento) => treinamento.id === id
    );

    if (treinamento) {
      setNewTreinamento({
        name: treinamento.name,
        courseModality: treinamento.courseModality,
        courseMethodology: treinamento.courseMethodology,
        courseType: treinamento.courseType,
        courseValidaty: treinamento.courseValidaty,
        courseHours: treinamento.courseHours,
        coursePortaria: treinamento.coursePortaria,
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      await api.patch(`treinamentos/${id}`, {
        status: {
          id: status,
        },
      });
      if (status === 1)
        toast("Treinamento ativado!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Treinamento inativado!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchTreinamentos();
    } catch (error) {}
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Treinamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) clearForm(), setTreinamentoInEditMode("");
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Treinamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {treinamentoInEditMode ? "Editar" : "Adicionar"} Treinamento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do treinamento</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newTreinamento.name}
                    placeholder="Ex: Treinamento de NR10"
                    onChange={handleInputChange}
                    required={treinamentoInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseModality">Modalidade</Label>
                  <Input
                    id="courseModality"
                    name="courseModality"
                    placeholder="Ex: Presencial, EAD, Semipresencial"
                    value={newTreinamento.courseModality}
                    onChange={handleInputChange}
                    required={treinamentoInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseMethodology">Metodologia</Label>
                  <Input
                    id="courseMethodology"
                    name="courseMethodology"
                    placeholder="Ex: Teórico, Prático, Teórico-Prático"
                    value={newTreinamento.courseMethodology}
                    onChange={handleInputChange}
                    required={treinamentoInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseType">Tipo de Formação</Label>
                  <Input
                    id="courseType"
                    name="courseType"
                    value={newTreinamento.courseType}
                    onChange={handleInputChange}
                    placeholder="Ex: Formação ou Atualização Periódica"
                    required={treinamentoInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseValidaty">Validade do curso</Label>
                  <Input
                    id="courseValidaty"
                    name="courseValidaty"
                    value={newTreinamento.courseValidaty}
                    placeholder="Ex: 12 meses"
                    onChange={handleInputChange}
                    required={treinamentoInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseHours">Horas do curso</Label>
                  <Input
                    id="courseHours"
                    name="courseHours"
                    type="number"
                    placeholder="Ex: 40"
                    value={newTreinamento.courseHours}
                    onChange={handleInputChange}
                    required={treinamentoInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coursePortaria">
                    Portaria do treinamento
                  </Label>
                  <Input
                    id="coursePortaria"
                    name="coursePortaria"
                    value={newTreinamento.coursePortaria}
                    onChange={handleInputChange}
                    placeholder="Ex: Portaria 321/2019"
                    required={treinamentoInEditMode ? false : true}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false),
                        clearForm(),
                        setTreinamentoInEditMode("");
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
              <TableHead>Treinamento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Modalidade</TableHead>
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
            ) : treinamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhum treinamento encontrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              treinamentos.map((treinamento) => (
                <TableRow
                  key={treinamento.id}
                  className={treinamento.status.id !== 1 ? "line-through" : ""}
                >
                  <TableCell className="font-medium max-w-[20rem] overflow-hidden whitespace-nowrap overflow-ellipsis py-2">
                    {treinamento.name}
                  </TableCell>
                  <TableCell className="py-2">
                    {treinamento.courseType}
                  </TableCell>
                  <TableCell className="py-2">
                    {treinamento.courseModality}
                  </TableCell>
                  <TableCell className="py-2">
                    {treinamento.status.id !== 2 ? "Ativo" : "Inativo"}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      onClick={() => handleEdit(treinamento.id)}
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                      disabled={treinamento.status.id !== 1}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {treinamento.status.id === 1 ? (
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
                              Tem certeza que deseja inativar este treinamento?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Está ação podera ser revertida posteriormente. Mas
                              o treinamento não podera ser utilizada enquanto
                              estiver inativa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="w-20">
                              Não
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="w-20"
                              onClick={() =>
                                handleUpdateStatus(treinamento.id, 2)
                              }
                            >
                              Sim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        onClick={() => handleUpdateStatus(treinamento.id, 1)}
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

export default Treinamentos;
