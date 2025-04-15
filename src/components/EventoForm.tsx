import React, { useState, useEffect } from "react";
import { format, parse, isValid, differenceInMinutes, add } from "date-fns";
import toast from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { Empresa } from "@/@types/Empresa";
import { Treinamento } from "@/@types/Treinamento";
import { Evento } from "@/@types/Evento";
import { Checkbox } from "./ui/checkbox";

interface EventoFormProps {
  initialData?: Evento; // Dados para edição (opcional)
  empresas: Empresa[];
  treinamentos: Treinamento[];
  onSubmit: (payload: any) => Promise<void>;
  onCancel: () => void;
}

interface NovoEventoState {
  empresa: { id: string };
  treinamento: { id: string };
  titulo: string;
  courseLocation: string;
  courseLocation2: string;
  courseDate: string;
  courseTime: string;
  courseInterval: string;
}

const initialEventoState: NovoEventoState = {
  empresa: { id: "" },
  treinamento: { id: "" },
  titulo: "",
  courseLocation: "",
  courseLocation2: "",
  courseDate: "",
  courseTime: "",
  courseInterval: "",
};

const EventoForm: React.FC<EventoFormProps> = ({
  initialData,
  empresas,
  treinamentos,
  onSubmit,
  onCancel,
}) => {
  const [newEvento, setNewEvento] = useState<NovoEventoState>(
    initialData
      ? {
          empresa: { id: initialData.empresa.id },
          treinamento: { id: initialData.treinamento.id },
          titulo: initialData.titulo,
          courseLocation: initialData.courseLocation,
          courseLocation2: initialData.courseLocation2,
          courseDate: initialData.courseDate.join(", "),
          courseTime: initialData.courseTime,
          courseInterval: initialData.courseInterval,
        }
      : initialEventoState
  );
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    initialData?.courseDate.map((dateStr) => {
      try {
        const parsed = JSON.parse(dateStr);
        return add(new Date(parsed.day), { days: 1 });
      } catch (error) {
        // Se não conseguir fazer o parse, assume que a string já é a data
        return new Date(dateStr.trim());
      }
    }) || []
  );

  const [turnoFinal, setTurnoFinal] = useState<"manha" | "tarde" | "">("");
  const [mostrarTurno, setMostrarTurno] = useState(false);
  const [cargaHorariaAviso, setCargaHorariaAviso] = useState<string | null>(
    null
  );

  useEffect(() => {
    const computeCargaHorariaAviso = (): string | null => {
      // Dados essenciais
      if (
        selectedDates.length === 0 ||
        !newEvento.courseTime ||
        !newEvento.treinamento.id
      ) {
        return null;
      }

      const treinamento = treinamentos.find(
        (t) => t.id === newEvento.treinamento.id
      );
      if (!treinamento) return null;
      const requiredHours = Number(treinamento.courseHours || "0");

      // Parse dos horários do evento
      const [startTimeStr, endTimeStr] = newEvento.courseTime
        .split("ÀS")
        .map((s) => s.trim());
      if (!startTimeStr) return `⚠️ Informe o horário de início do evento`;
      if (!endTimeStr) return `⚠️ Informe o horário de término do evento`;

      let startTime = parse(startTimeStr, "HH:mm", new Date());
      let endTime = parse(endTimeStr, "HH:mm", new Date());

      if (!isValid(startTime)) return `⚠️ Horário de início inválido`;
      if (!isValid(endTime)) return `⚠️ Horário de término inválido`;

      // Ensure minutes are properly formatted as two digits
      const formatWithLeadingZero = (time: Date) =>
        format(time, "HH:mm").replace(/:(\d)$/, ":0$1");

      startTime = parse(formatWithLeadingZero(startTime), "HH:mm", new Date());
      endTime = parse(formatWithLeadingZero(endTime), "HH:mm", new Date());

      // Cálculo do total de minutos do dia
      const totalMinutes = differenceInMinutes(endTime, startTime);

      // Verifica o intervalo: se o campo existir, estiver preenchido e for diferente de "N/A",
      // calcula os minutos do intervalo; caso contrário, assume 0.
      let intervalMinutes = 0;
      let intervalStart: Date | null = null;
      let intervalEnd: Date | null = null;
      const hasInterval =
        newEvento.courseInterval &&
        newEvento.courseInterval.trim() !== "" &&
        newEvento.courseInterval !== "N/A";
      if (hasInterval) {
        const [intervalStartStr, intervalEndStr] = newEvento.courseInterval
          .split("ÀS")
          .map((s) => s.trim());
        if (!intervalStartStr || !intervalEndStr)
          return `⚠️ Informe o intervalo completo do evento ou marque como "N/A"`;
        intervalStart = parse(intervalStartStr, "HH:mm", new Date());
        intervalEnd = parse(intervalEndStr, "HH:mm", new Date());
        if (!isValid(intervalStart))
          return `⚠️ Horário de início do intervalo inválido`;
        if (!isValid(intervalEnd))
          return `⚠️ Horário de término do intervalo inválido`;
        intervalMinutes = differenceInMinutes(intervalEnd, intervalStart);
      }

      // Calcula os minutos úteis do dia (descontando o intervalo, se houver)
      const usableMinutes = totalMinutes - intervalMinutes;
      if (usableMinutes <= 0)
        return `⚠️ O horário informado, subtraído o intervalo, não permite calcular a carga horária.`;
      const usableHoursPerDay = usableMinutes / 60;
      const totalDays = selectedDates.length;
      const totalAvailableHours = totalDays * usableHoursPerDay;

      // Prefixo para a mensagem exibida ao usuário
      let message = `Treinamento requer ${requiredHours}h. Disponível: ${totalAvailableHours.toFixed(
        2
      )}h em ${totalDays} dia(s). `;

      // Caso de apenas 1 dia: a carga horária precisa ser exatamente igual à exigida.
      if (totalDays === 1) {
        if (usableHoursPerDay < requiredHours)
          return `${message}⚠️ O dia selecionado comporta apenas ${usableHoursPerDay.toFixed(
            2
          )}h, mas o treinamento exige ${requiredHours}h.`;
        if (usableHoursPerDay > requiredHours)
          return `${message}⚠️ O dia selecionado oferece ${usableHoursPerDay.toFixed(
            2
          )}h, excedendo as ${requiredHours}h exigidas.`;
        return `✅ ${message} Carga horária distribuída corretamente (${usableHoursPerDay.toFixed(
          2
        )}h).`;
      }

      // Para múltiplos dias:
      // Se NÃO houver intervalo (ou seja, sem possibilidade de ajustar o último dia):
      if (!hasInterval) {
        if (totalAvailableHours !== requiredHours)
          return `${message}⚠️ A carga horária total (${totalAvailableHours.toFixed(
            2
          )}h) não corresponde exatamente às ${requiredHours}h exigidas.`;
        return `✅ ${message} Carga horária distribuída corretamente.`;
      }

      // Se houver intervalo, permite ajustar o último dia.
      const accumulated = (totalDays - 1) * usableHoursPerDay;
      const finalDayRequiredHours = requiredHours - accumulated;
      if (finalDayRequiredHours < 0)
        return `${message}⚠️ A soma dos dias selecionados excede as ${requiredHours}h exigidas.`;
      if (finalDayRequiredHours === 0 && totalDays > 1)
        return `${message}⚠️ Para um treinamento de ${requiredHours}h, apenas 1 data é necessária.`;

      // Calcula os períodos disponíveis no último dia considerando o intervalo.
      // Esses valores só fazem sentido se houver intervalo definido.
      const morningAvailable =
        differenceInMinutes(intervalStart!, startTime) / 60;
      const afternoonAvailable =
        differenceInMinutes(endTime, intervalEnd!) / 60;

      // Se os horários do último dia não permitirem ajustar exatamente finalDayRequiredHours,
      // informa o erro.
      if (
        finalDayRequiredHours > morningAvailable &&
        finalDayRequiredHours > afternoonAvailable
      ) {
        return `${message}⚠️ O horário do último dia não comporta as ${finalDayRequiredHours.toFixed(
          2
        )}h restantes.`;
      }

      // Se o usuário ainda não definiu o turno (manhã ou tarde), solicita a seleção.
      if (!turnoFinal)
        return `${message}⚠️ Restam ${finalDayRequiredHours.toFixed(
          2
        )}h para completar as ${requiredHours}h. Selecione o turno do último dia.`;

      // Verifica se o turno escolhido comporta as horas necessárias.
      if (turnoFinal === "manha" && finalDayRequiredHours > morningAvailable)
        return `${message}⚠️ O turno "manha" não comporta as ${finalDayRequiredHours.toFixed(
          2
        )}h restantes.`;
      if (turnoFinal === "tarde" && finalDayRequiredHours > afternoonAvailable)
        return `${message}⚠️ O turno "tarde" não comporta as ${finalDayRequiredHours.toFixed(
          2
        )}h restantes.`;

      return `✅ ${message} Carga horária distribuída corretamente (${accumulated.toFixed(
        2
      )}h + ${finalDayRequiredHours.toFixed(2)}h).`;
    };

    setCargaHorariaAviso(computeCargaHorariaAviso());
  }, [
    selectedDates,
    newEvento.courseTime,
    newEvento.courseInterval,
    newEvento.treinamento.id,
    treinamentos,
    turnoFinal,
  ]);

  // Atualiza o estado de "mostrarTurno" com base nas datas e nos horários selecionados
  useEffect(() => {
    if (
      selectedDates.length >= 2 &&
      newEvento.courseTime &&
      newEvento.courseInterval &&
      newEvento.treinamento.id
    ) {
      const treinamento = treinamentos.find(
        (t) => t.id === newEvento.treinamento.id
      );
      if (!treinamento) {
        setMostrarTurno(false);
        return;
      }
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
  }, [
    selectedDates,
    newEvento.courseTime,
    newEvento.courseInterval,
    newEvento.treinamento.id,
    treinamentos,
  ]);
  // Funções auxiliares para formatação de horário
  const formatTimeForInput = (time: string): [string, string] => {
    if (!time) return ["", ""];
    const times = time.split(" ÀS ");
    return [times[0] || "", times[1] || ""];
  };

  const formatTimeForStorage = (time: string): string => {
    try {
      const parsedTime = parse(time, "HH:mm", new Date());
      if (time === "00:00 ÀS 00:00") return "";
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
    let value = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (value.length > 2) value = value.replace(/^(\d{2})/, "$1:");
    if (value.length > 5) return; // Limita a 5 caracteres

    const [hh, mm] = value.split(":");
    if (hh && parseInt(hh) > 23) return;
    if (mm && parseInt(mm) > 59) return;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvento((prev) => ({ ...prev, [name]: value }));
  };

  // Função de submit do formulário que realiza as validações necessárias e estrutura o payload
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações obrigatórias
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
    const treinamento = treinamentos.find(
      (t) => t.id === newEvento.treinamento.id
    );
    if (
      !newEvento.courseInterval &&
      treinamento &&
      Number(treinamento.courseHours) > 4
    ) {
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
      const requiredHours = Number(treinamento?.courseHours || "0");
      const accumulated = (totalDays - 1) * usableHoursPerDay;
      const finalDayRequiredHours = requiredHours - accumulated;

      if (turnoFinal === "manha") {
        const finalEndDate = add(startTime, { hours: finalDayRequiredHours });
        finalCourseTime = `${format(startTime, "HH:mm")} ÀS ${format(
          finalEndDate,
          "HH:mm"
        )}`;
      } else if (turnoFinal === "tarde") {
        const finalStart = parse(intervalEndStr, "HH:mm", new Date());
        const finalEndDate = add(finalStart, { hours: finalDayRequiredHours });
        finalCourseTime = `${format(finalStart, "HH:mm")} ÀS ${format(
          finalEndDate,
          "HH:mm"
        )}`;
      } else {
        const extraAfterMorning = finalDayRequiredHours - morningAvailable;
        const finalEndDate = add(intervalEnd, { hours: extraAfterMorning });
        finalCourseTime = `${format(startTime, "HH:mm")} ÀS ${format(
          finalEndDate,
          "HH:mm"
        )}`;
      }
    }

    // Monta a lista de datas com os horários correspondentes
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
        courseIntervalStart: intervalStartStr || "",
        courseIntervalEnd: intervalEndStr || "",
      });
    });

    const payload = {
      ...newEvento,
      courseDate: formattedDates,
      completionDate: JSON.parse(formattedDates[formattedDates.length - 1]).day,
      courseTime: formatTimeForStorage(newEvento.courseTime),
      courseInterval: formatTimeForStorage(newEvento.courseInterval),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Coluna com informações do contratante, treinamento e local */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="titulo">Nome do Evento</Label>
            <Input
              id="titulo"
              name="titulo"
              value={newEvento.titulo}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa">Contratante</Label>
            <Select
              onValueChange={(value) =>
                setNewEvento((prev) => ({ ...prev, empresa: { id: value } }))
              }
              value={newEvento.empresa.id}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent className="max-h-72 w-full max-w-[40rem]">
                <SelectGroup>
                  <SelectLabel>Empresa:</SelectLabel>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="treinamento">Treinamento</Label>
            <Select
              onValueChange={(value) =>
                setNewEvento((prev) => ({
                  ...prev,
                  treinamento: { id: value },
                }))
              }
              value={newEvento.treinamento.id}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um treinamento" />
              </SelectTrigger>
              <SelectContent className="max-h-72 max-w-[40rem]">
                <SelectGroup>
                  <SelectLabel>Treinamento:</SelectLabel>
                  {treinamentos.map((treinamento) => (
                    <SelectItem key={treinamento.id} value={treinamento.id}>
                      {treinamento.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseLocation">Local de treinamento 1</Label>
            <Input
              id="courseLocation"
              name="courseLocation"
              value={newEvento.courseLocation}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseLocation2">Local de treinamento 2</Label>
            <Input
              id="courseLocation2"
              name="courseLocation2"
              placeholder="Clique para adicionar"
              value={newEvento.courseLocation2}
              onChange={handleInputChange}
            />
          </div>
          <p className="text-sm text-yellow-600 mt-2">{cargaHorariaAviso}</p>
        </div>
        {/* Coluna com seleção de datas, horários e intervalos */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Datas do Evento</Label>
            <DayPicker
              mode="multiple"
              selected={
                selectedDates.length > 0
                  ? selectedDates
                  : initialData?.courseDate.map((dateStr) => {
                      try {
                        const parsed = JSON.parse(dateStr);
                        return add(new Date(parsed.day), { days: 1 });
                      } catch (error) {
                        // Se não conseguir fazer o parse, assume que a string já é a data
                        return new Date(dateStr.trim());
                      }
                    }) || []
              }
              onSelect={(dates) => setSelectedDates(dates || [])}
            />
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                name="courseTimeStart"
                placeholder="HH:MM"
                onChange={(e) => handleTimeChange(e, true, "courseTime")}
                value={formatTimeForInput(newEvento.courseTime)[0] || ""}
                maxLength={5}
              />
              <span>ÀS</span>
              <Input
                type="text"
                name="courseTimeEnd"
                placeholder="HH:MM"
                onChange={(e) => handleTimeChange(e, false, "courseTime")}
                value={formatTimeForInput(newEvento.courseTime)[1] || ""}
                maxLength={5}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Intervalo</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                name="courseIntervalStart"
                placeholder="HH:MM"
                onChange={(e) => handleTimeChange(e, true, "courseInterval")}
                value={
                  formatTimeForInput(newEvento.courseInterval)[0] !== "N/A"
                    ? formatTimeForInput(newEvento.courseInterval)[0] || ""
                    : ""
                }
                maxLength={5}
                disabled={
                  formatTimeForInput(newEvento.courseInterval)[0] === "N/A"
                }
              />
              <span>ÀS</span>
              <Input
                type="text"
                name="courseIntervalEnd"
                placeholder="HH:MM"
                onChange={(e) => handleTimeChange(e, false, "courseInterval")}
                value={formatTimeForInput(newEvento.courseInterval)[1] || ""}
                maxLength={5}
                disabled={
                  formatTimeForInput(newEvento.courseInterval)[0] === "N/A"
                }
              />
            </div>
            <p className="flex items-center gap-2 space-x-2">
              <Checkbox
                checked={newEvento.courseInterval === "N/A"}
                onClick={(e) => {
                  e.stopPropagation();
                  setNewEvento((prev) => ({
                    ...prev,
                    courseInterval: prev.courseInterval === "N/A" ? "" : "N/A",
                  }));
                }}
              />
              Sem intervalo
            </p>
          </div>
          {mostrarTurno && (
            <>
              <Label>Turno do último dia</Label>
              <ToggleGroup
                type="single"
                value={turnoFinal}
                onValueChange={(value) =>
                  setTurnoFinal(value as "manha" | "tarde")
                }
                className="flex gap-2"
              >
                <ToggleGroupItem value="manha">Manhã</ToggleGroupItem>
                <ToggleGroupItem value="tarde">Tarde</ToggleGroupItem>
              </ToggleGroup>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            cargaHorariaAviso !== null && !cargaHorariaAviso.startsWith("✅")
          }
        >
          {initialData ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
};

export default EventoForm;
