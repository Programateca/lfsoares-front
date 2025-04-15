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
          <Dialog
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
              {/* <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Nome do Evento</Label>
                  <Input
                    id="titulo"
                    name="titulo"
                    value={newEvento.titulo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 ">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Contratante</Label>
                      <Select
                        onValueChange={(value) => {
                          setNewEvento((prev) => ({
                            ...prev,
                            empresa: { id: value },
                          }));
                        }}
                        value={newEvento.empresa.id}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 w-full max-w-[40rem]">
                          <SelectGroup>
                            <SelectLabel>Empresa:</SelectLabel>
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
                    <div className="space-y-2">
                      <Label htmlFor="treinamento">Treinamento</Label>
                      <Select
                        onValueChange={(value) => {
                          setNewEvento((prev) => ({
                            ...prev,
                            treinamento: {
                              id: value,
                            },
                          }));
                        }}
                        value={newEvento.treinamento.id}
                        required
                      >
                        <SelectTrigger className="w-full justify-start items-start flex ">
                          <SelectValue
                            placeholder="Selecione um treinamento"
                            className="self-start"
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 max-w-[40rem]">
                          <SelectGroup>
                            <SelectLabel>Treinamento:</SelectLabel>
                            {treinamentos.map((treinamento) => {
                              return (
                                <SelectItem
                                  key={treinamento.id}
                                  value={treinamento.id}
                                  className="self-start"
                                >
                                  {treinamento.name}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseLocation">
                        Local de treinamento 1
                      </Label>
                      <Input
                        id="courseLocation"
                        name="courseLocation"
                        value={newEvento.courseLocation}
                        onChange={handleInputChange}
                        required={eventoInEditMode ? false : true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseLocation2">
                        Local de treinamento 2
                      </Label>
                      <Input
                        className={`${
                          newEvento.courseLocation2
                            ? ""
                            : "border-dashed text-center"
                        }`}
                        id="courseLocation2"
                        name="courseLocation2"
                        placeholder="Clique para adicionar"
                        value={newEvento.courseLocation2}
                        onChange={handleInputChange}
                        onFocus={(e) => {
                          e.target.classList.remove(
                            "border-dashed",
                            "text-center"
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="selectedDates">Datas do Evento</Label>
                      <div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full flex justify-start"
                            >
                              {selectedDates.length > 0
                                ? `Selecionadas ${selectedDates.length} data(s)`
                                : "Selecionar as datas"}{" "}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DayPicker
                              mode="multiple"
                              locale={ptBR}
                              selected={selectedDates}
                              className="flex justify-center items-center self-center"
                              onSelect={(dates) =>
                                setSelectedDates(dates || [])
                              }
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseTime">Horário</Label>
                      <div className="flex items-center space-x-2 max-sm:flex-wrap max-sm:space-x-0 max-sm:gap-3 max-sm:justify-center">
                        <Input
                          type="text"
                          name="courseTimeStart"
                          placeholder="HH:MM"
                          onChange={(e) =>
                            handleTimeChange(e, true, "courseTime")
                          }
                          value={
                            formatTimeForInput(newEvento.courseTime)[0] || ""
                          }
                          maxLength={5}
                        />
                        <span>ÀS</span>
                        <Input
                          type="text"
                          name="courseTimeEnd"
                          placeholder="HH:MM"
                          onChange={(e) =>
                            handleTimeChange(e, false, "courseTime")
                          }
                          value={
                            formatTimeForInput(newEvento.courseTime)[1] || ""
                          }
                          maxLength={5}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseInterval">Intervalo</Label>
                      <div className="flex items-center space-x-2 max-sm:flex-wrap max-sm:space-x-0 max-sm:gap-3 max-sm:justify-center">
                        <Input
                          type="text"
                          name="courseIntervalStart"
                          placeholder="HH:MM"
                          onChange={(e) =>
                            handleTimeChange(e, true, "courseInterval")
                          }
                          value={
                            formatTimeForInput(newEvento.courseInterval)[0] ||
                            ""
                          }
                          maxLength={5}
                        />
                        <span>ÀS</span>
                        <Input
                          type="text"
                          name="courseIntervalEnd"
                          placeholder="HH:MM"
                          onChange={(e) =>
                            handleTimeChange(e, false, "courseInterval")
                          }
                          value={
                            formatTimeForInput(newEvento.courseInterval)[1] ||
                            ""
                          }
                          maxLength={5}
                        />
                      </div>
                    </div>
                    {getCargaHorariaAviso() && (
                      <p className="text-sm text-yellow-600 mt-2">
                        {getCargaHorariaAviso()}
                      </p>
                    )}
                    {mostrarTurno && (
                      <>
                        <Label>Turno do último dia</Label>
                        <ToggleGroup
                          type="single"
                          value={turnoFinal}
                          onValueChange={(value) =>
                            setTurnoFinal(value as "manha" | "tarde")
                          }
                          className="flex gap-2 justify-start "
                        >
                          <ToggleGroupItem
                            value="manha"
                            onClick={() => setTurnoFinal("manha")}
                          >
                            Manhã
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="tarde"
                            onClick={() => setTurnoFinal("tarde")}
                          >
                            Tarde
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetEventoState();
                      seteventoInEditMode("");
                      setSelectedDates([]);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      cargaHorariaAviso !== null &&
                      cargaHorariaAviso !== "" &&
                      !cargaHorariaAviso.startsWith("✅")
                    }
                  >
                    Adicionar
                  </Button>
                </div>
              </form> */}
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
      </CardContent>
    </Card>
  );
};

export default Eventos;
