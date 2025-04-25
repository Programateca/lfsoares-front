import React, { useState, useEffect } from "react";
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

import { Empresa } from "@/@types/Empresa";
import { Treinamento } from "@/@types/Treinamento";
import { Evento } from "@/@types/Evento";
import { Calendar } from "./Calendar";

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
  courseDate: string[];
  courseTime: string;
  courseInterval: string;
}

const initialEventoState: NovoEventoState = {
  empresa: { id: "" },
  treinamento: { id: "" },
  titulo: "",
  courseLocation: "",
  courseLocation2: "",
  courseDate: [],
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
          courseDate: initialData.courseDate,
          courseTime: initialData.courseTime,
          courseInterval: initialData.courseInterval,
        }
      : initialEventoState
  );

  const [cargaHorariaAviso, setCargaHorariaAviso] = useState<string>("");
  const [isValidSchedule, setIsValidSchedule] = useState(false);
  const [statusType, setStatusType] = useState("default");

  useEffect(() => {
    if (newEvento.courseDate.length > 0) {
      const parsedArray = newEvento.courseDate.map((item) => JSON.parse(item));

      handleScheduleChange(parsedArray);
    }
  }, [newEvento.treinamento.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvento((prev) => ({ ...prev, [name]: value }));
  };

  // Função de submit do formulário que realiza as validações necessárias e estrutura o payload
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...newEvento,
    };

    await onSubmit(payload);
  };

  const handleScheduleChange = (
    scheduleArray: {
      start: string;
      end: string;
      intervalStart: string;
      intervalEnd: string;
    }[]
  ) => {
    const stringifiedArray = scheduleArray.map((item) => JSON.stringify(item));

    setNewEvento((prev) => ({
      ...prev,
      courseDate: stringifiedArray,
    }));

    // Calcular total de minutos agendados
    const totalMinutes = scheduleArray
      .filter((item) => item !== null && item !== undefined)
      .reduce((sum, day) => {
        if (day.start === "N/A" || day.end === "N/A") return sum;

        const [sh, sm] = day.start.split(":").map(Number);
        const [eh, em] = day.end.split(":").map(Number);

        // Calcular minutos do dia (excluindo intervalo se houver)
        let dayMinutes = eh * 60 + em - (sh * 60 + sm);

        // Subtrair tempo de intervalo se existir
        if (day.intervalStart !== "N/A" && day.intervalEnd !== "N/A") {
          const [ih, im] = day.intervalStart.split(":").map(Number);
          const [jh, jm] = day.intervalEnd.split(":").map(Number);
          const intervalMinutes = jh * 60 + jm - (ih * 60 + im);
          dayMinutes -= Math.max(0, intervalMinutes);
        }

        return sum + Math.max(0, dayMinutes);
      }, 0);

    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;

    // Obter carga exigida do treinamento selecionado
    const treino = treinamentos.find((t) => t.id === newEvento.treinamento.id);
    const requiredHours = treino ? Number.parseInt(treino.courseHours, 10) : 0;
    const requiredMinutes = requiredHours * 60;

    // Montar mensagem de aviso
    let msg = `⏱️ Carga total: ${totalHours}h ${totalMins}m.`;
    let newStatusType = "default";

    if (requiredHours) {
      msg += ` Curso exige: ${requiredHours}h.`;

      if (totalMinutes === requiredMinutes) {
        msg += " ✅ Carga horária exata atingida!";
        newStatusType = "success";
      } else if (totalMinutes > requiredMinutes) {
        const excesso = totalMinutes - requiredMinutes;
        const excessoH = Math.floor(excesso / 60);
        const excessoM = excesso % 60;
        msg += ` ⚠️ Excesso de ${excessoH}h ${excessoM}m. Reduza a carga horária.`;
        newStatusType = "error";
      } else {
        const faltam = requiredMinutes - totalMinutes;
        const faltamH = Math.floor(faltam / 60);
        const faltamM = faltam % 60;
        msg += ` ⚠️ Faltam ${faltamH}h ${faltamM}m para cumprir.`;
        newStatusType = "warning";
      }
    }

    setCargaHorariaAviso(msg);
    setStatusType(newStatusType);
    setIsValidSchedule(requiredHours === 0 || totalMinutes === requiredMinutes);
  };

  const getAlertVariant = () => {
    switch (statusType) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800 p-4 rounded-lg";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 p-4 rounded-lg";
      case "error":
        return "bg-red-50 border-red-200 text-red-800 p-4 rounded-lg";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 p-4 rounded-lg";
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="flex flex-col gap-4">
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
          <div className="flex justify-between gap-4 w-full">
            <div className="space-y-2 flex-1">
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
                <SelectContent className="max-h-72 w-full ">
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
            <div className="space-y-2 flex-1 relative">
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
                <SelectContent className="max-h-72 w-full overflow-y-auto">
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
          </div>
          <div className="flex justify-between gap-4 w-full">
            <div className="space-y-2 flex-1">
              <Label htmlFor="courseLocation">Local 1</Label>
              <Input
                id="courseLocation"
                name="courseLocation"
                value={newEvento.courseLocation}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="courseLocation2">Local 2</Label>
              <Input
                id="courseLocation2"
                name="courseLocation2"
                placeholder="Clique para adicionar"
                value={newEvento.courseLocation2}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>
      <Calendar
        onScheduleChange={handleScheduleChange}
        initialSchedule={initialData?.courseDate}
      />
      {cargaHorariaAviso && (
        <p className={getAlertVariant()}>{cargaHorariaAviso}</p>
      )}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isValidSchedule && !!newEvento.treinamento.id}
          className={
            !isValidSchedule && newEvento.treinamento.id
              ? "opacity-50 cursor-not-allowed"
              : ""
          }
        >
          {initialData ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
};

export default EventoForm;
