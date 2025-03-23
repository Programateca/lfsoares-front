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

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";
import { Empresa } from "@/@types/Empresa";
import { Treinamento } from "@/@types/Treinamento";
import { Evento } from "@/@types/Evento";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";
import {
  format,
  parseISO,
  isValid,
  parse,
  differenceInMinutes,
  differenceInCalendarDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const Eventos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventoInEditMode, seteventoInEditMode] = useState<string | number>("");
  const [newEvento, setNewEvento] = useState({
    empresa: { id: "" },
    treinamento: { id: "" },
    courseLocation: "",
    courseLocation2: "",
    courseDate: "",
    courseTime: "",
    courseInterval: "",
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
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
    setNewEvento({
      empresa: { id: "" },
      treinamento: { id: "" },
      courseLocation: "",
      courseLocation2: "",
      courseDate: "",
      courseTime: "",
      courseInterval: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "courseDate" || name === "completionDate") {
      setNewEvento((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setNewEvento((prev) => ({ ...prev, [name]: value }));
  };

  // const formatDateForInput = (date: string) => {
  //   if (!date) return "";
  //   try {
  //     return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  //   } catch {
  //     return date;
  //   }
  // };

  const formatTimeForInput = (time: string) => {
    if (!time) return ["", ""]; // Se não houver horário, retorna array vazio

    const times = time.split(" ÀS "); // Divide o horário no " ÀS "
    return [times[0] || "", times[1] || ""]; // Retorna os dois valores corretamente
  };

  // const formatDateForStorage = (date: string) => {
  //   try {
  //     const parsedDate = parse(date, "dd/MM/yyyy", new Date());
  //     if (isValid(parsedDate)) {
  //       return format(parsedDate, "yyyy-MM-dd");
  //     }
  //     return date;
  //   } catch {
  //     return date;
  //   }
  // };

  const formatTimeForStorage = (time: string) => {
    try {
      const parsedTime = parse(time, "HH:mm", new Date());
      return isValid(parsedTime) ? format(parsedTime, "HH:mm") : time;
    } catch {
      return time;
    }
  };

  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isStart: boolean,
    field: "courseTime" | "courseInterval"
  ) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número

    if (value.length > 2) value = value.replace(/^(\d{2})/, "$1:"); // Adiciona `:` após HH
    if (value.length > 5) return; // Impede mais de 5 caracteres

    const [hh, mm] = value.split(":");

    if (hh && parseInt(hh) > 23) return; // Bloqueia horas inválidas (> 23)
    if (mm && parseInt(mm) > 59) return; // Bloqueia minutos inválidos (> 59)

    // Atualizar o horário correto sem afetar o outro valor
    setNewEvento((prev) => {
      let [startTime, endTime] = prev[field].split(" ÀS ");
      startTime = isStart ? value : startTime || "";
      endTime = isStart ? endTime || "" : value;

      return {
        ...prev,
        [field]: `${startTime} ÀS ${endTime}`,
      };
    });
  };

  // Função para lidar com a mudança no input de data
  // const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   let value = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos

  //   if (value.length > 2) value = value.replace(/^(\d{2})/, "$1/"); // Adiciona `/` após o dia
  //   if (value.length > 5) value = value.replace(/^(\d{2})\/(\d{2})/, "$1/$2/"); // Adiciona `/` após o mês

  //   if (value.length > 10) return; // Impede mais de 10 caracteres

  //   setNewEvento((prev) => ({
  //     ...prev,
  //     [e.target.name]: value,
  //   }));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedDates = selectedDates.map((date) =>
      format(date, "yyyy-MM-dd")
    );

    const payload = {
      ...newEvento,
      courseDate: formattedDates,
      completionDate: formattedDates[formattedDates.length - 1],
      courseTime: formatTimeForStorage(newEvento.courseTime),
      courseInterval: formatTimeForStorage(newEvento.courseInterval),
    };

    const startDateStr = formattedDates[0];
    const endDateStr = formattedDates[formattedDates.length - 1];

    const startDate = parse(startDateStr, "yyyy-MM-dd", new Date());
    const endDate = parse(endDateStr, "yyyy-MM-dd", new Date());

    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

    const [startTimeStr, endTimeStr] = newEvento.courseTime
      .split("ÀS")
      .map((s) => s.trim());
    const startTime = parse(startTimeStr, "HH:mm", new Date());
    const endTime = parse(endTimeStr, "HH:mm", new Date());

    const durationMinutes = differenceInMinutes(endTime, startTime);
    const availableHoursPerDay = durationMinutes / 60;

    const totalAvailableHours = totalDays * availableHoursPerDay;

    const treinamento = treinamentos.find(
      (t) => t.id === newEvento.treinamento.id
    );
    const requiredHours = Number(treinamento?.courseHours || "0");

    if (totalAvailableHours < requiredHours) {
      toast.error(
        `O período informado (totalizando ${totalAvailableHours.toFixed(
          2
        )}h disponíveis) não comporta a carga horária de ${requiredHours}h.`
      );
      return; // Interrompe o envio do formulário
    }
    if (eventoInEditMode) {
      try {
        await api.patch(`eventos/${eventoInEditMode}`, payload);

        fetchEventos();
        setIsModalOpen(false);
        toast.success("Evento atualizado com sucesso");
        resetEventoState();
      } catch (error) {}
      return;
    }

    try {
      await api.post("Eventos", payload);

      fetchEventos();
      setIsModalOpen(false);
      toast.success("Evento criado com sucesso");
      resetEventoState();
    } catch (error) {}
  };

  const handleEdit = (id: string | number) => {
    seteventoInEditMode(id);
    setIsModalOpen(true);

    const evento = eventos.find((evento) => evento.id === id);

    if (evento) {
      const [startTime, endTime] = formatTimeForInput(evento.courseTime);
      const [intervalStart, intervalEnd] = formatTimeForInput(
        evento.courseInterval
      );

      setNewEvento({
        empresa: { id: evento.empresa.id },
        treinamento: { id: evento.treinamento.id },
        courseLocation: evento.courseLocation,
        courseLocation2: evento.courseLocation2,
        courseDate: evento.courseDate.join(", "),
        courseTime: `${startTime} ÀS ${endTime}`, // Preenchendo corretamente o estado
        courseInterval: `${intervalStart} ÀS ${intervalEnd}`, // Preenchendo corretamente o estado
      });
      setSelectedDates(evento.courseDate.map((date) => parseISO(date)));
    }
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

  const getEventDisplay = (evento: Evento) => {
    // Obter o id do evento
    // Usar a primeira data do array de datas, se existir
    const firstDate = evento.courseDate?.[0]
      ? format(parseISO(evento.courseDate[0]), "dd/MM/yyyy")
      : "";
    const lastDate = evento.courseDate?.[evento.courseDate.length - 1]
      ? format(
          parseISO(evento.courseDate[evento.courseDate.length - 1]),
          "dd/MM/yyyy"
        )
      : "";
    const eventDates =
      evento.courseDate?.length > 1
        ? `Evento dos dias ${firstDate} até ${lastDate}`
        : `Evento do dia ${firstDate}`;

    // Obter o comprimento do evento
    const eventLength = evento.courseDate?.length || 0;

    return `${eventDates} - ${eventLength} dias`;
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
                setSelectedDates([]);
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent>
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
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um treinamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Treinamento:</SelectLabel>
                            {treinamentos.map((treinamento) => {
                              return (
                                <SelectItem
                                  key={treinamento.id}
                                  value={treinamento.id}
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
                              Selecionar as datas
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
            {
              key: "evento",
              label: "Evento",
              render: (_, rowData) => getEventDisplay(rowData),
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
