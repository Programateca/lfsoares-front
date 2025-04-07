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
import { format, parseISO, isValid, parse } from "date-fns";
import differenceInMinutes from "date-fns/differenceInMinutes";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const Eventos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventoInEditMode, seteventoInEditMode] = useState<string | number>("");
  const [newEvento, setNewEvento] = useState({
    empresa: { id: "" },
    treinamento: { id: "" },
    titulo: "",
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

  const [turnoFinal, setTurnoFinal] = useState<"manha" | "tarde" | "">("");
  const [mostrarTurno, setMostrarTurno] = useState(false);

  useEffect(() => {
    const updateMostrarTurno = () => {
      if (
        selectedDates.length >= 2 &&
        newEvento.courseTime &&
        newEvento.courseInterval &&
        newEvento.treinamento.id
      ) {
        const treinamento = treinamentos.find(
          (t) => t.id === newEvento.treinamento.id
        );
        if (!treinamento) return;

        const requiredHours = Number(treinamento.courseHours || "0");

        const [startTimeStr, endTimeStr] = newEvento.courseTime
          .split("ÀS")
          .map((s) => s.trim());
        const startTime = parse(startTimeStr, "HH:mm", new Date());
        const endTime = parse(endTimeStr, "HH:mm", new Date());

        const [intervalStartStr, intervalEndStr] = newEvento.courseInterval
          .split("ÀS")
          .map((s) => s.trim());
        const intervalStart = parse(intervalStartStr, "HH:mm", new Date());
        const intervalEnd = parse(intervalEndStr, "HH:mm", new Date());

        const dailyMinutes = differenceInMinutes(endTime, startTime);
        const intervalMinutes = differenceInMinutes(intervalEnd, intervalStart);
        const usableHours = (dailyMinutes - intervalMinutes) / 60;

        const accumulatedHours = (selectedDates.length - 1) * usableHours;
        const remainingHours = requiredHours - accumulatedHours;

        setMostrarTurno(remainingHours > 0 && remainingHours < usableHours);
      } else {
        setMostrarTurno(false);
      }
    };

    updateMostrarTurno();
  }, [
    selectedDates,
    newEvento.courseTime,
    newEvento.courseInterval,
    newEvento.treinamento.id,
  ]);

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
      titulo: "",
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

  const formatTimeForInput = (time: string) => {
    if (!time) return ["", ""]; // Se não houver horário, retorna array vazio

    const times = time.split(" ÀS "); // Divide o horário no " ÀS "
    return [times[0] || "", times[1] || ""]; // Retorna os dois valores corretamente
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvento.empresa.id) {
      toast.error("Selecione o contratante");
      return;
    }

    if (!newEvento.treinamento.id) {
      toast.error("Selecione um treinamento");
      return;
    }

    if (!newEvento.courseLocation) {
      toast.error("Informe o local de treinamento");
      return;
    }

    if (selectedDates.length === 0) {
      toast.error("Selecione pelo menos uma data");
      return;
    }

    if (!newEvento.courseTime) {
      toast.error("Informe o horário do evento");
      return;
    }

    if (!newEvento.courseInterval) {
      toast.error("Informe o intervalo do evento");
      return;
    }

    const [startTimeStr, endTimeStr] = newEvento.courseTime
      .split("ÀS")
      .map((s) => s.trim());
    const [intervalStartStr, intervalEndStr] = newEvento.courseInterval
      .split("ÀS")
      .map((s) => s.trim());

    let finalCourseTime = "";

    if (mostrarTurno) {
      const startTime = parse(startTimeStr, "HH:mm", new Date());
      const endTime = parse(endTimeStr, "HH:mm", new Date());
      const intervalStart = parse(intervalStartStr, "HH:mm", new Date());
      const intervalEnd = parse(intervalEndStr, "HH:mm", new Date());

      const morningAvailable =
        differenceInMinutes(intervalStart, startTime) / 60;
      const afternoonAvailable = differenceInMinutes(endTime, intervalEnd) / 60;
      const usableHoursPerDay = morningAvailable + afternoonAvailable;
      const totalDays = selectedDates.length;

      const treinamento = treinamentos.find(
        (t) => t.id === newEvento.treinamento.id
      );
      const requiredHours = Number(treinamento?.courseHours || "0");
      const accumulated = (totalDays - 1) * usableHoursPerDay;
      const finalDayRequiredHours = requiredHours - accumulated;

      if (turnoFinal === "manha") {
        // Horário final = startTime + finalDayRequiredHours horas
        const finalEndDate = add(startTime, { hours: finalDayRequiredHours });
        finalCourseTime = `${format(startTime, "HH:mm")} ÀS ${format(
          finalEndDate,
          "HH:mm"
        )}`;
      } else if (turnoFinal === "tarde") {
        // Horário final = intervalEnd + finalDayRequiredHours horas
        const finalStart = parse(intervalEndStr, "HH:mm", new Date());
        const finalEndDate = add(finalStart, { hours: finalDayRequiredHours });
        finalCourseTime = `${format(finalStart, "HH:mm")} ÀS ${format(
          finalEndDate,
          "HH:mm"
        )}`;
      } else {
        // Caso o restante exija ambos os períodos
        const extraAfterMorning = finalDayRequiredHours - morningAvailable;
        const finalEndDate = add(intervalEnd, { hours: extraAfterMorning });
        finalCourseTime = `${format(startTime, "HH:mm")} ÀS ${format(
          finalEndDate,
          "HH:mm"
        )}`;
      }
    }

    const formattedDates = selectedDates.map((date, index) => {
      const formattedDate = format(date, "yyyy-MM-dd");
      let courseStart = startTimeStr;
      let courseEnd = endTimeStr;

      if (
        mostrarTurno &&
        index === selectedDates.length - 1 &&
        finalCourseTime
      ) {
        const [finalStart, finalEnd] = finalCourseTime
          .split("ÀS")
          .map((s) => s.trim());
        courseStart = finalStart;
        courseEnd = finalEnd;
      }

      return JSON.stringify({
        day: formattedDate,
        courseStart,
        courseEnd,
        courseIntervalStart: intervalStartStr,
        courseIntervalEnd: intervalEndStr,
      });
    });

    const payload = {
      ...newEvento,
      courseDate: formattedDates,
      completionDate: JSON.parse(formattedDates[formattedDates.length - 1]).day,
      courseTime: formatTimeForStorage(newEvento.courseTime),
      courseInterval: formatTimeForStorage(newEvento.courseInterval),
    };
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
      await api.post("eventos", payload);

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
        titulo: evento.titulo,
      });
      setSelectedDates(
        evento.courseDate.map((date) => {
          const parsed = JSON.parse(date);
          return parseISO(parsed.day);
        })
      );
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

  const getCargaHorariaAviso = () => {
    if (
      selectedDates.length === 0 ||
      !newEvento.courseTime ||
      !newEvento.courseInterval ||
      !newEvento.treinamento.id
    ) {
      return null;
    }

    const treinamento = treinamentos.find(
      (t) => t.id === newEvento.treinamento.id
    );
    if (!treinamento) return null;
    const requiredHours = Number(treinamento.courseHours || "0");

    // Parse dos horários
    const [startTimeStr, endTimeStr] = newEvento.courseTime
      .split("ÀS")
      .map((s) => s.trim());

    // Validação dos horários de início e fim
    if (!startTimeStr) {
      return `⚠️ Informe o horário de início do evento`;
    }
    if (!endTimeStr) {
      return `⚠️ Informe o horário de término do evento`;
    }

    const startTime = parse(startTimeStr, "HH:mm", new Date());
    const endTime = parse(endTimeStr, "HH:mm", new Date());

    // Verifica se os horários são válidos
    if (!isValid(startTime)) {
      return `⚠️ Horário de início inválido`;
    }
    if (!isValid(endTime)) {
      return `⚠️ Horário de término inválido`;
    }

    const [intervalStartStr, intervalEndStr] = newEvento.courseInterval
      .split("ÀS")
      .map((s) => s.trim());

    if (!intervalStartStr || !intervalEndStr) {
      return `⚠️ Informe o intervalo completo do evento`;
    }

    const intervalStart = parse(intervalStartStr, "HH:mm", new Date());
    const intervalEnd = parse(intervalEndStr, "HH:mm", new Date());

    if (!isValid(intervalStart)) {
      return `⚠️ Horário de início do intervalo inválido`;
    }
    if (!isValid(intervalEnd)) {
      return `⚠️ Horário de término do intervalo inválido`;
    }

    // Cálculo dos horários do dia
    const totalMinutes = differenceInMinutes(endTime, startTime);
    const intervalMinutes = differenceInMinutes(intervalEnd, intervalStart);
    const usableMinutes = totalMinutes - intervalMinutes;
    const usableHoursPerDay = usableMinutes / 60;
    const totalDays = selectedDates.length;

    const totalAvailableHours = totalDays * usableHoursPerDay;
    if (totalAvailableHours < requiredHours) {
      return `⚠️ A carga horária total (${totalAvailableHours}h) não atinge as ${requiredHours}h exigidas.`;
    }

    // Se só 1 dia, valida direto
    if (totalDays === 1) {
      const totalHoras = usableHoursPerDay;
      if (totalHoras < requiredHours)
        return `⚠️ O dia selecionado comporta apenas ${totalHoras}h, mas o treinamento exige ${requiredHours}h.`;
      if (totalHoras > requiredHours)
        return `⚠️ Horário excede a carga horária exigida de ${requiredHours}h.`;
      return `✅ Carga horária distribuída corretamente (${totalHoras}h).`;
    }

    // Para múltiplos dias
    const accumulated = (totalDays - 1) * usableHoursPerDay;
    const finalDayRequiredHours = requiredHours - accumulated;

    if (finalDayRequiredHours < 0)
      return `⚠️ Horário total excede a carga horária exigida de ${requiredHours}h.`;
    if (finalDayRequiredHours === 0) {
      if (totalDays > 1) {
        return `⚠️ Para um treinamento de ${requiredHours}h, apenas 1 data é necessária.`;
      }
      return `✅ Carga horária distribuída corretamente (${accumulated}h + 0h).`;
    }

    // Cálculo dos períodos disponíveis
    const morningAvailable = differenceInMinutes(intervalStart, startTime) / 60;
    const afternoonAvailable = differenceInMinutes(endTime, intervalEnd) / 60;

    if (
      finalDayRequiredHours <= morningAvailable ||
      finalDayRequiredHours <= afternoonAvailable
    ) {
      if (!turnoFinal) {
        return `⚠️ Restam ${finalDayRequiredHours}h para completar ${requiredHours}h. Selecione o turno do último dia.`;
      }
      if (turnoFinal === "manha" && finalDayRequiredHours > morningAvailable) {
        return `⚠️ O turno "manha" não comporta as ${finalDayRequiredHours}h restantes.`;
      }
      if (
        turnoFinal === "tarde" &&
        finalDayRequiredHours > afternoonAvailable
      ) {
        return `⚠️ O turno "tarde" não comporta as ${finalDayRequiredHours}h restantes.`;
      }
      return `✅ Carga horária distribuída corretamente (${accumulated}h + ${finalDayRequiredHours}h).`;
    } else {
      return `✅ Carga horária distribuída corretamente.`;
    }
  };

  const cargaHorariaAviso = getCargaHorariaAviso();
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
                        required
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

function add(date: Date, duration: { hours: number }): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + duration.hours);
  return result;
}
