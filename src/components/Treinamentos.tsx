import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";

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
  id: string | number;
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

  const handleEdit = (id: string | number) => {
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

  const handleUpdateStatus = async (id: string | number, status: number) => {
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
        <CustomTable
          columns={[
            { key: "name", label: "Treinamento" },
            { key: "courseType", label: "Tipo" },
            { key: "courseModality", label: "Modalidade" },
            { key: "status.name", label: "Status" },
          ]}
          data={treinamentos}
          onEdit={handleEdit}
          onDelete={handleUpdateStatus}
          onRestore={handleUpdateStatus}
          loading={loading}
          entityLabel="Treinamento"
          searchable
        />
      </CardContent>
    </Card>
  );
};

export default Treinamentos;
