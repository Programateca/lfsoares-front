import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";

import toast from "react-hot-toast";
import CustomTable from "./CustomTable";

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

const Integrantes = () => {
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
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const [showInativos, setShowInativos] = useState(false);
  const filteredData = showInativos
    ? instrutores.filter((p) => p.status.id === 2)
    : instrutores.filter((p) => p.status.id === 1);

  const fetchInstrutores = async (pageNumber: number = 1, search = "") => {
    try {
      setLoading(true);
      const response = await api.get("instrutores", {
        params: {
          page: pageNumber,
          limit,
          search: search || undefined,
        },
      });
      setInstrutores(response.data.data);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
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
      const response = await api.get("instrutores", {
        params: { page: newPage, limit },
      });

      setInstrutores(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar instrutores");
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
        fetchInstrutores(1, searchQuery);
      } else {
        // Se o termo tiver menos de 3 letras, busca sem filtro ou limpa os resultados, conforme sua lógica
        fetchInstrutores(page);
      }
    }, 300); // tempo de debounce: 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchInstrutores(page, searchQuery.length >= 3 ? searchQuery : "");
  }, [page]);

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

  const handleEdit = (id: string | number) => {
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

  const handleUpdateStatus = async (id: string | number, status: number) => {
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
        <CardTitle className="text-gray-800">Lista de Integrantes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          {/* <div className="flex items-center space-x-2">
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
          </div> */}
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
                <Plus className="mr-2 h-4 w-4" /> Adicionar Integrantes
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Integrantes</DialogTitle>
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
                  <Label htmlFor="qualificacaoProfissional">
                    Qualificação profissional
                  </Label>
                  <Input
                    id="qualificacaoProfissional"
                    name="qualificacaoProfissional"
                    value={newInstrutor.qualificacaoProfissional}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registroProfissional">
                    Registro profissional
                  </Label>
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
          <Button
            onClick={() => setShowInativos((prev) => !prev)}
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
          >
            {showInativos ? "Ocultar Inativos" : "Mostrar Inativos"}
          </Button>
        </div>
        <CustomTable
          columns={[
            { key: "name", label: "Nome Completo" },
            {
              key: "qualificacaoProfissional",
              label: "Qualificação Profissional",
            },
            { key: "registroProfissional", label: "Registro Profissional" },
            { key: "status.name", label: "Status" },
          ]}
          data={filteredData}
          onEdit={handleEdit}
          onDelete={handleUpdateStatus}
          onRestore={handleUpdateStatus}
          loading={loading}
          entityLabel="Instrutor"
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

export default Integrantes;
