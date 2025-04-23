import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Empresa } from "@/@types/Empresa";
import { Treinamento } from "@/@types/Treinamento";
import { Evento } from "@/@types/Evento";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";
import "react-day-picker/dist/style.css";
import EventoForm from "./EventoForm";

const Eventos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventoInEditMode, seteventoInEditMode] = useState<string | number>("");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formsOpen, setFormsOpen] = useState(false);
  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const [showInativos, setShowInativos] = useState(false);
  const filteredData = showInativos
    ? eventos.filter((p) => p.status.id === 2)
    : eventos.filter((p) => p.status.id === 1);

  const fetchEventos = async (pageNumber: number = 1, search = "") => {
    try {
      setLoading(true);
      const response = await api.get("eventos", {
        params: { page: pageNumber, limit, search },
      });
      setEventos(response.data.data);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar eventos");
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
      const response = await api.get("eventos", {
        params: { page: newPage, limit },
      });

      setEventos(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar eventos");
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
        fetchEventos(1, searchQuery);
      } else {
        // Se o termo tiver menos de 3 letras, busca sem filtro ou limpa os resultados, conforme sua lógica
        fetchEventos(page);
      }
    }, 300); // tempo de debounce: 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchEventos(page, searchQuery.length >= 3 ? searchQuery : "");
  }, [page]);

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchEventos();
      const empresaResp = await api.get("empresas", {
        params: { limit: 100000 },
      });
      const empresasAtivas = empresaResp.data.data.filter(
        (e: Empresa) => e.status.id === 1
      );
      setEmpresas(empresasAtivas);
      const treinamentoResp = await api.get("treinamentos", {
        params: { limit: 100000 },
      });
      const treinamentosAtivos = treinamentoResp.data.data.filter(
        (t: Treinamento) => t.status.id === 1
      );
      setTreinamentos(treinamentosAtivos);
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const resetEventoState = () => {
    seteventoInEditMode("");
  };

  const handleEdit = (id: string | number) => {
    seteventoInEditMode(id);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id: string | number, status: number) => {
    try {
      await api.patch(`eventos/${id}`, {
        status: {
          id: status,
        },
      });

      fetchEventos();
    } catch (error) {}
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          {/* <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                resetEventoState();
                seteventoInEditMode("");
              }
            }}
            key={isModalOpen ? "open" : "closed"}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Eventos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] lg:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>
                  {eventoInEditMode ? "Editar" : "Adicionar"} Evento
                </DialogTitle>
              </DialogHeader>
              <EventoForm
                // Se estiver em modo de edição, passe os dados do evento encontrado, senão undefined
                initialData={
                  eventoInEditMode
                    ? eventos.find((evento) => evento.id === eventoInEditMode)
                    : undefined
                }
                empresas={empresas}
                treinamentos={treinamentos}
                onSubmit={async (payload) => {
                  if (eventoInEditMode) {
                    try {
                      await api.patch(`eventos/${eventoInEditMode}`, payload);
                      toast.success("Evento atualizado com sucesso");
                    } catch (error) {
                      toast.error("Erro ao atualizar evento");
                    }
                  } else {
                    try {
                      await api.post("eventos", payload);
                      toast.success("Evento criado com sucesso");
                    } catch (error) {
                      toast.error("Erro ao criar evento");
                    }
                  }
                  fetchEventos();
                  resetEventoState();
                  setIsModalOpen(false);
                }}
                onCancel={() => {
                  resetEventoState();
                  setIsModalOpen(false);
                }}
              />
          
            </DialogContent>
          </Dialog> */}
          <Button
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
            onClick={() => {
              setFormsOpen((prev) => !prev);
              resetEventoState();
              seteventoInEditMode("");
            }}
          >
            {formsOpen ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Tabela
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Evento
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowInativos((prev) => !prev)}
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
          >
            {showInativos ? "Ocultar Inativos" : "Mostrar Inativos"}
          </Button>
        </div>
        {formsOpen ? (
          <EventoForm
            initialData={
              eventoInEditMode
                ? eventos.find((evento) => evento.id === eventoInEditMode)
                : undefined
            }
            empresas={empresas}
            treinamentos={treinamentos}
            onSubmit={async (payload) => {
              if (eventoInEditMode) {
                try {
                  await api.patch(`eventos/${eventoInEditMode}`, payload);
                  toast.success("Evento atualizado com sucesso");
                } catch (error) {
                  toast.error("Erro ao atualizar evento");
                }
              } else {
                try {
                  await api.post("eventos", payload);
                  toast.success("Evento criado com sucesso");
                } catch (error) {
                  toast.error("Erro ao criar evento");
                  console.log(error);
                }
              }
              fetchEventos();
              resetEventoState();
              setFormsOpen(false);
            }}
            onCancel={() => {
              resetEventoState();
              setFormsOpen(false);
            }}
          />
        ) : (
          <CustomTable
            columns={[
              {
                key: "titulo",
                label: "Evento",
              },
              { key: "treinamento.name", label: "Treinamento" },
              { key: "empresa.name", label: "Contratante" },
              {
                key: "createdAt",
                label: "Data de Criação",
                render: (value) => new Date(value).toLocaleDateString("pt-BR"),
              },
            ]}
            data={filteredData}
            onEdit={handleEdit}
            onDelete={handleUpdateStatus}
            onRestore={handleUpdateStatus}
            loading={loading}
            entityLabel="Evento"
            searchable
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            hasNextPage={hasNextPage}
            page={page}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default Eventos;
