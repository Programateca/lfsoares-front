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

interface Empresa {
  id: string;
  name: string;
  cnpj: string;
  endereco: string;
  status: Status;
}

const Empresas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empresaInEditMode, setEmpresaInEditMode] = useState<string | number>(
    ""
  );
  const [newEmpresa, setNewEmpresa] = useState({
    name: "",
    cnpj: "",
    endereco: "",
  });
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const fetchEmpresas = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("empresas", {
        params: {
          page: pageNumber,
          limit,
        },
      });
      setEmpresas(response.data.data);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar empresas");
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
      const response = await api.get("empresas", {
        params: { page: newPage, limit },
      });

      setEmpresas(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar empresas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas(page);
  }, [page]);

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchEmpresas();
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmpresa((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (empresaInEditMode) {
      try {
        await api.patch(`empresas/${empresaInEditMode}`, {
          name: newEmpresa.name,
          cnpj: newEmpresa.cnpj,
          endereco: newEmpresa.endereco,
        });

        fetchEmpresas();
        setIsModalOpen(false);
        toast.success("Empresa atualizada com sucesso!");
        setNewEmpresa({
          name: "",
          cnpj: "",
          endereco: "",
        });
      } catch (error) {}
      return;
    }

    try {
      await api.post("empresas", {
        name: newEmpresa.name,
        cnpj: newEmpresa.cnpj,
        endereco: newEmpresa.endereco,
      });

      fetchEmpresas();
      setIsModalOpen(false);
      toast.success("Empresa cadastrada com sucesso!");
      setNewEmpresa({
        name: "",
        cnpj: "",
        endereco: "",
      });
    } catch (error) {}
  };
  const handleEdit = (id: string | number) => {
    setEmpresaInEditMode(id);
    setIsModalOpen(true);

    const empresa = empresas.find((empresa) => empresa.id === id);

    if (empresa) {
      setNewEmpresa({
        name: empresa.name,
        cnpj: empresa.cnpj,
        endereco: empresa.endereco,
      });
    }
  };

  const handleUpdateStatus = async (id: string | number, status: number) => {
    try {
      await api.patch(`empresas/${id}`, {
        status: {
          id: status,
        },
      });
      if (status === 1)
        toast("Empresa ativado!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Empresa inativado!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchEmpresas();
    } catch (error) {}
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Empresas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open)
                setNewEmpresa({
                  name: "",
                  cnpj: "",
                  endereco: "",
                });
              setEmpresaInEditMode("");
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Empresas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar nova empresa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newEmpresa.name}
                    onChange={handleInputChange}
                    required={empresaInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    value={newEmpresa.cnpj}
                    onChange={(e) => {
                      const { value } = e.target;
                      const formattedValue = value
                        .replace(/\D/g, "")
                        .replace(/^(\d{2})(\d)/, "$1.$2")
                        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                        .replace(/\.(\d{3})(\d)/, ".$1/$2")
                        .replace(/(\d{4})(\d)/, "$1-$2");
                      setNewEmpresa((prev) => ({
                        ...prev,
                        cnpj: formattedValue,
                      }));
                    }}
                    required={empresaInEditMode ? false : true}
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    type="endereco"
                    value={newEmpresa.endereco}
                    onChange={handleInputChange}
                    required={empresaInEditMode ? false : true}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false),
                        setNewEmpresa({
                          name: "",
                          cnpj: "",
                          endereco: "",
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
        <CustomTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "cnpj", label: "CNPJ" },
            { key: "status.name", label: "Status" },
          ]}
          data={empresas}
          onEdit={handleEdit}
          onDelete={handleUpdateStatus}
          onRestore={handleUpdateStatus}
          loading={loading}
          entityLabel="Empresa"
          searchable
          hasNextPage={hasNextPage}
          page={page}
          onPageChange={handlePageChange}
        />
      </CardContent>
    </Card>
  );
};

export default Empresas;
