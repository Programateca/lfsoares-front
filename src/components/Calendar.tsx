import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";

interface CalendarProps {
  onScheduleChange: (
    schedule: Array<{
      date: string;
      start: string;
      end: string;
      intervalStart: string;
      intervalEnd: string;
    }>
  ) => void;
  initialSchedule?: string[];
}

export function Calendar({ onScheduleChange, initialSchedule }: CalendarProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timesByDate, setTimesByDate] = useState<
    Record<
      string,
      {
        start: string;
        end: string;
        breakStart: string;
        breakEnd: string;
        hasInterval: boolean;
      }
    >
  >({});
  const [uniformTimes, setUniformTimes] = useState({ start: "", end: "" });
  const [uniformBreak, setUniformBreak] = useState({
    breakStart: "",
    breakEnd: "",
  });

  const initDateTimes = () => ({
    start: "",
    end: "",
    breakStart: "",
    breakEnd: "",
    hasInterval: true,
  });

  useEffect(() => {
    if (!initialSchedule) return;

    const parsed = initialSchedule.map((str) => JSON.parse(str));

    // Preenche datas selecionadas
    const dates = parsed.map((item) => {
      const [year, month, day] = item.date.split("-").map(Number);
      return new Date(year, month - 1, day);
    });
    setSelectedDates(dates);

    // Preenche horários por data
    const times: Record<
      string,
      {
        start: string;
        end: string;
        breakStart: string;
        breakEnd: string;
        hasInterval: boolean;
      }
    > = {};
    parsed.forEach((item) => {
      const key = item.date;
      times[key] = {
        start: item.start,
        end: item.end,
        breakStart: item.intervalStart,
        breakEnd: item.intervalEnd,
        hasInterval: item.intervalStart !== "N/A" && item.intervalEnd !== "N/A",
      };
    });

    setTimesByDate(times);
  }, [initialSchedule]);

  const handleSelect = (dates: Date[] | undefined) => {
    const list = dates || [];
    setSelectedDates(list);
    setTimesByDate((prev) => {
      const updated: Record<string, ReturnType<typeof initDateTimes>> = {};
      list.forEach((date) => {
        const key = format(date, "yyyy-MM-dd");
        updated[key] = prev[key] || initDateTimes();
      });
      return updated;
    });
  };

  //@ts-ignore
  const handleTimeChange = (dateKey, field, value) => {
    setTimesByDate((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], [field]: value || "" },
    }));
  };

  //@ts-ignore
  const handleIntervalToggle = (dateKey, hasInterval) => {
    setTimesByDate((prev) => {
      const current = prev[dateKey];
      return {
        ...prev,
        [dateKey]: {
          ...current,
          hasInterval,
          breakStart:
            hasInterval && (current.breakStart === "N/A" || !current.breakStart)
              ? ""
              : current.breakStart,
          breakEnd:
            hasInterval && (current.breakEnd === "N/A" || !current.breakEnd)
              ? ""
              : current.breakEnd,
        },
      };
    });
  };

  const applyUniformTimes = () => {
    setTimesByDate((prev) => {
      const updated = { ...prev };
      selectedDates.forEach((d) => {
        const key = format(d, "yyyy-MM-dd");
        updated[key] = {
          ...updated[key],
          start: uniformTimes.start,
          end: uniformTimes.end,
        };
      });
      return updated;
    });
  };

  const applyUniformBreak = () => {
    setTimesByDate((prev) => {
      const updated = { ...prev };
      selectedDates.forEach((d) => {
        const key = format(d, "yyyy-MM-dd");
        updated[key] = {
          ...updated[key],
          hasInterval: true,
          breakStart: uniformBreak.breakStart,
          breakEnd: uniformBreak.breakEnd,
        };
      });
      return updated;
    });
  };

  const getScheduleArray = () =>
    selectedDates.map((date) => {
      const key = format(date, "yyyy-MM-dd");
      const t = timesByDate[key];

      if (!t) return null;

      return {
        date: key,
        start: t.start || "N/A",
        end: t.end || "N/A",
        intervalStart: t.hasInterval ? t.breakStart || "N/A" : "N/A",
        intervalEnd: t.hasInterval ? t.breakEnd || "N/A" : "N/A",
      };
    });

  useEffect(() => {
    onScheduleChange(getScheduleArray().filter((item) => item !== null));
  }, [timesByDate, selectedDates]);

  return (
    <div className="border rounded-md p-3">
      <DayPicker
        mode="multiple"
        locale={ptBR}
        selected={selectedDates}
        onSelect={handleSelect}
        footer={
          selectedDates.length > 0
            ? `Você selecionou ${selectedDates.length} dia${
                selectedDates.length > 1 ? "s" : ""
              }.`
            : "Selecione um ou mais dias."
        }
      />

      {selectedDates.length > 0 && (
        <div className="mt-4">
          {/* Horário padrão */}
          <div className="mb-2 p-2 border rounded">
            <p className="font-semibold mb-1">Horário padrão:</p>
            <div className="grid grid-cols-2 gap-2">
              <TimePicker
                onChange={(val) =>
                  setUniformTimes((u) => ({ ...u, start: val || "" }))
                }
                value={uniformTimes.start}
                disableClock
                format="HH:mm"
                locale="pt-BR"
              />
              <TimePicker
                onChange={(val) =>
                  setUniformTimes((u) => ({ ...u, end: val || "" }))
                }
                value={uniformTimes.end}
                disableClock
                format="HH:mm"
                locale="pt-BR"
              />
            </div>
            <Button type="button" className="mt-1" onClick={applyUniformTimes}>
              Aplicar horários
            </Button>
          </div>

          {/* Intervalo padrão */}
          <div className="mb-2 p-2 border rounded">
            <p className="font-semibold mb-1">Intervalo padrão:</p>
            <div className="grid grid-cols-2 gap-2">
              <TimePicker
                onChange={(val) =>
                  setUniformBreak((b) => ({ ...b, breakStart: val || "" }))
                }
                value={uniformBreak.breakStart}
                disableClock
                format="HH:mm"
                locale="pt-BR"
              />
              <TimePicker
                onChange={(val) =>
                  setUniformBreak((b) => ({ ...b, breakEnd: val || "" }))
                }
                value={uniformBreak.breakEnd}
                disableClock
                format="HH:mm"
                locale="pt-BR"
              />
            </div>
            <Button type="button" className="mt-1" onClick={applyUniformBreak}>
              Aplicar intervalo
            </Button>
          </div>

          {/* Configurações individuais */}
          <p className="font-semibold mb-1">Configurações individuais:</p>
          {selectedDates.map((date) => {
            const key = format(date, "yyyy-MM-dd");
            const t = timesByDate[key];
            if (!t) return null;
            return (
              <div key={key} className="mb-2 p-2 border rounded">
                <p className="font-medium text-sm mb-1">
                  {date.toLocaleDateString("pt-BR")}
                </p>
                <div className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`no-interval-${key}`}
                    checked={!t.hasInterval}
                    onChange={(e) =>
                      handleIntervalToggle(key, !e.target.checked)
                    }
                    className="mr-2"
                  />
                  <label htmlFor={`no-interval-${key}`} className="text-sm">
                    Desativar intervalo
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TimePicker
                    onChange={(val) => handleTimeChange(key, "start", val)}
                    value={t.start}
                    disableClock
                    format="HH:mm"
                    locale="pt-BR"
                  />
                  <TimePicker
                    onChange={(val) => handleTimeChange(key, "end", val)}
                    value={t.end}
                    disableClock
                    format="HH:mm"
                    locale="pt-BR"
                  />
                  {t.hasInterval ? (
                    <>
                      <TimePicker
                        onChange={(val) =>
                          handleTimeChange(key, "breakStart", val)
                        }
                        value={t.breakStart}
                        disableClock
                        format="HH:mm"
                        locale="pt-BR"
                      />
                      <TimePicker
                        onChange={(val) =>
                          handleTimeChange(key, "breakEnd", val)
                        }
                        value={t.breakEnd}
                        disableClock
                        format="HH:mm"
                        locale="pt-BR"
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-sm italic">N/A</p>
                      <p className="text-sm italic">N/A</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
