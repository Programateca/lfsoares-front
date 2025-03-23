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

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";
import { Textarea } from "./ui/textarea";

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
  conteudoAplicado: string;
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
    conteudoAplicado: "",
  });
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const [showInativos, setShowInativos] = useState(false);
  const filteredData = showInativos
    ? treinamentos.filter((p) => p.status.id === 2)
    : treinamentos.filter((p) => p.status.id === 1);

  const fetchTreinamentos = async (pageNumber: number = 1, search = "") => {
    try {
      setLoading(true);
      const response = await api.get("treinamentos", {
        params: {
          page: pageNumber,
          limit,
          search,
        },
      });
      setTreinamentos(response.data.data);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar treinamentos");
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
      const response = await api.get("treinamentos", {
        params: { page: newPage, limit },
      });

      setTreinamentos(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar treinamentos");
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
        fetchTreinamentos(1, searchQuery);
      } else {
        // Se o termo tiver menos de 3 letras, busca sem filtro ou limpa os resultados, conforme sua lógica
        fetchTreinamentos(page);
      }
    }, 300); // tempo de debounce: 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchTreinamentos(page, searchQuery.length >= 3 ? searchQuery : "");
  }, [page]);

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
      conteudoAplicado: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTreinamento((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { selectionStart, value } = e.target;

    // Divide o texto atual em linhas
    const linhas = value.split("\n");

    // Determina em qual linha o cursor se encontra
    let linhaAtualIndex = 0;
    let acumulado = 0;
    for (let i = 0; i < linhas.length; i++) {
      // +1 para considerar o caractere de quebra de linha
      if (selectionStart <= acumulado + linhas[i].length) {
        linhaAtualIndex = i;
        break;
      }
      acumulado += linhas[i].length + 1;
    }

    // Para cada linha, remove a numeração antiga e aplica a nova
    const linhasSemNumeracao = linhas.map((linha: string) =>
      linha.replace(/^\d+\.\s*/, "")
    );

    const linhasNumeradas = linhasSemNumeracao.map(
      (linha: string, index: number) => {
        if (linha.trim() === "") return "";
        return `${index + 1}. ${linha}`;
      }
    );

    const novoTexto = linhasNumeradas.join("\n");

    // Calcula a nova posição do cursor na linha atual
    const linhaOriginal = linhas[linhaAtualIndex];
    const prefixoAntigoMatch = linhaOriginal.match(/^(\d+\.\s*)/);
    const prefixoAntigoLength = prefixoAntigoMatch
      ? prefixoAntigoMatch[0].length
      : 0;
    const novoPrefixo = `${linhaAtualIndex + 1}. `;
    const novoPrefixoLength = novoPrefixo.length;
    const diff = novoPrefixoLength - prefixoAntigoLength;
    const novaPosicao = selectionStart + diff;

    // Atualiza o estado com o novo texto
    setNewTreinamento((prev) => ({
      ...prev,
      conteudoAplicado: novoTexto,
    }));

    // Restaura a posição do cursor após a atualização do estado
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = novaPosicao;
        textareaRef.current.selectionEnd = novaPosicao;
      }
    }, 0);
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
          conteudoAplicado: newTreinamento.conteudoAplicado,
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
        conteudoAplicado: newTreinamento.conteudoAplicado,
      });

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
        conteudoAplicado: treinamento.conteudoAplicado,
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
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>
                  {treinamentoInEditMode ? "Editar" : "Adicionar"} Treinamento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div>
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
                  <div className="space-y-2">
                    <Label>Conteúdo Aplicado</Label>
                    <Textarea
                      ref={textareaRef}
                      name="conteudoAplicado"
                      value={newTreinamento.conteudoAplicado}
                      onChange={handleTextareaChange}
                      required
                    />
                  </div>
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
          <Button
            onClick={() => setShowInativos((prev) => !prev)}
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
          >
            {showInativos ? "Ocultar Inativos" : "Mostrar Inativos"}
          </Button>
        </div>
        <CustomTable
          columns={[
            { key: "name", label: "Treinamento" },
            { key: "courseType", label: "Tipo" },
            { key: "courseModality", label: "Modalidade" },
            { key: "status.name", label: "Status" },
          ]}
          data={filteredData}
          onEdit={handleEdit}
          onDelete={handleUpdateStatus}
          onRestore={handleUpdateStatus}
          loading={loading}
          entityLabel="Treinamento"
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

export default Treinamentos;
