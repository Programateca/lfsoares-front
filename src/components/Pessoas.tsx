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
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const fetchPessoas = async (pageNumber: number = 1, search = "") => {
    try {
      setLoading(true);
      const response = await api.get("pessoas", {
        params: { page: pageNumber, limit, search },
      });
      setPessoas(response.data.data);
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
      const response = await api.get("pessoas", {
        params: { page: newPage, limit },
      });

      setPessoas(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar pessoas.");
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
        fetchPessoas(1, searchQuery);
      } else {
        // Se o termo tiver menos de 3 letras, busca sem filtro ou limpa os resultados, conforme sua lógica
        fetchPessoas(page);
      }
    }, 300); // tempo de debounce: 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchPessoas(page, searchQuery.length >= 3 ? searchQuery : "");
  }, [page]);

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
          cpf: newPessoa.cpf || "",
          matricula: newPessoa.matricula || "",
          empresa: {
            id:
              pessoa &&
              pessoa.empresa &&
              (newPessoa.empresa.id === pessoa.empresa.id ||
                newPessoa.empresa.id === "")
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
      } catch (error) {
        toast.error("Erro ao atualizar pessoa.");
      }
      return;
    }

    try {
      await api.post("pessoas", {
        name: newPessoa.name,
        cpf: newPessoa.cpf,
        matricula: newPessoa.matricula,
        empresa: {
          id: newPessoa.empresa.id === "0" ? null : newPessoa.empresa.id,
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

  const handleEdit = (id: string | number) => {
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
          id: pessoa.empresa?.id || "",
          name: pessoa.empresa?.name || "",
        },
      });
    }
  };

  const handleUpdateStatus = async (id: string | number, status: number) => {
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
    } catch (error) {
      toast.error("Erro ao atualizar status da pessoa.");
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Pessoas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
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
            key={isModalOpen ? "open" : "closed"}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Pessoa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {pessoaInEditMode ? "Editar" : "Adicionar nova"} pessoa
                </DialogTitle>
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
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={newPessoa.cpf}
                    onChange={(e) => {
                      const { value } = e.target;
                      const formattedValue = value
                        .replace(/\D/g, "")
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                      setNewPessoa((prev) => ({
                        ...prev,
                        cpf: formattedValue,
                      }));
                    }}
                    required
                    pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matricula (opcional)</Label>
                  <Input
                    id="matricula"
                    name="matricula"
                    type="text"
                    placeholder="Ex: 000000"
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
                        <SelectItem value="0">Nenhuma</SelectItem>
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
                      setIsModalOpen(false);
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
                  <Button type="submit">
                    {pessoaInEditMode ? "Editar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CustomTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "cpf", label: "CPF" },
            { key: "empresa.name", label: "Empresa" },
            { key: "matricula", label: "Matricula" },
            { key: "status.name", label: "Status" },
          ]}
          data={pessoas}
          onEdit={handleEdit}
          onDelete={handleUpdateStatus}
          onRestore={handleUpdateStatus}
          loading={loading}
          entityLabel="Pessoa"
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

export default Pessoas;
