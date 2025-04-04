/**
 * Formata dinamicamente o trecho de data e horário de realização do treinamento,
 * distribuindo a carga horária total pelos dias informados e agrupando dias com o mesmo horário final.
 *
 * @param courseDate - Array de datas ou JSON strings com dados detalhados.
 * @param courseTime - Horário padrão do dia no formato "HH:MM ÀS HH:MM" (usado no formato antigo)
 * @param courseHours - Carga horária total do treinamento (em horas, como string, ex: "20")
 * @returns Texto formatado conforme a distribuição das horas e agrupamento dos dias.
 */
export function formatDataRealizada(
  courseDate: string | string[],
  courseTime: string,
  courseHours: string
): string {
  // Converte para array, se necessário
  let dateInputs: string[] =
    typeof courseDate === "string" ? [courseDate] : courseDate;

  // Verifica se os dados estão no novo formato JSON
  const isJSON = dateInputs.length > 0 && dateInputs[0].trim().startsWith("{");

  // Armazenará as atribuições (um objeto para cada dia)
  type DayAssignment = {
    date: Date;
    assignedHours: number;
    computedEndTime: string;
    courseStart: string;
  };
  let assignments: DayAssignment[] = [];
  let remainingHours = Number(courseHours);

  // Helper: converte horário "HH:MM" para minutos
  function parseTime(str: string): number {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  }

  // Helper: adiciona horas a um horário dado (em formato "HH:MM")
  function addHoursToTime(timeStr: string, hoursToAdd: number): string {
    let totalMinutes = parseTime(timeStr) + Math.round(hoursToAdd * 60);
    let newH = Math.floor(totalMinutes / 60) % 24;
    let newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, "0")}:${newM
      .toString()
      .padStart(2, "0")}`;
  }

  if (isJSON) {
    // Processamento para o formato JSON
    type DayData = {
      day: string;
      courseStart: string;
      courseEnd: string;
      courseIntervalStart: string;
      courseIntervalEnd: string;
    };
    const daysData: DayData[] = dateInputs.map((jsonStr) =>
      JSON.parse(jsonStr)
    );

    // Ordena os dias com base no campo "day" (formato "yyyy-MM-dd")
    daysData.sort(
      (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
    );

    for (const dayData of daysData) {
      const [year, month, day] = dayData.day.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      // Converte os horários para minutos
      const startMinutes = parseTime(dayData.courseStart);
      const endMinutes = parseTime(dayData.courseEnd);
      const intervalStartMinutes = parseTime(dayData.courseIntervalStart);
      const intervalEndMinutes = parseTime(dayData.courseIntervalEnd);

      // Calcula duração da manhã (do início até o início do intervalo)
      const morningDurationMinutes =
        intervalStartMinutes > startMinutes
          ? intervalStartMinutes - startMinutes
          : 0;
      // Calcula duração da tarde (do fim do intervalo até o fim)
      const afternoonDurationMinutes =
        intervalEndMinutes < endMinutes ? endMinutes - intervalEndMinutes : 0;

      // Duração efetiva total do dia (em horas)
      const effectiveDuration =
        (morningDurationMinutes + afternoonDurationMinutes) / 60;

      // Horas atribuídas para este dia
      const assigned =
        remainingHours >= effectiveDuration
          ? effectiveDuration
          : remainingHours;
      remainingHours -= assigned;

      // Calcula o horário final considerando a divisão entre manhã e tarde:
      let computedEndTime: string;
      // Se o tempo atribuído cabe inteiramente na manhã
      if (assigned <= morningDurationMinutes / 60) {
        computedEndTime = addHoursToTime(dayData.courseStart, assigned);
      } else {
        // O tempo excedente após a manhã é calculado a partir do fim do intervalo
        const extraHours = assigned - morningDurationMinutes / 60;
        computedEndTime = addHoursToTime(dayData.courseIntervalEnd, extraHours);
      }

      assignments.push({
        date: dateObj,
        assignedHours: assigned,
        computedEndTime,
        courseStart: dayData.courseStart,
      });

      if (remainingHours <= 0) break;
    }
  } else {
    // Processamento para o formato antigo (datas simples)
    const dates: Date[] = dateInputs.map((d) => {
      if (d.includes("/")) {
        const [day, month, year] = d.split("/");
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
      const [year, month, day] = d.split("-");
      return new Date(Number(year), Number(month) - 1, Number(day));
    });
    dates.sort((a, b) => a.getTime() - b.getTime());

    // Extrai os horários padrão do parâmetro courseTime ("HH:MM ÀS HH:MM")
    const [startTimeStr, fullEndTimeStr] = courseTime
      .split("ÀS")
      .map((s) => s.trim());
    const startTimeMinutes = parseTime(startTimeStr);
    const endTimeMinutes = parseTime(fullEndTimeStr);
    const defaultDayDuration = (endTimeMinutes - startTimeMinutes) / 60;

    for (let i = 0; i < dates.length; i++) {
      const assigned =
        remainingHours >= defaultDayDuration
          ? defaultDayDuration
          : remainingHours;
      remainingHours -= assigned;
      const computedEndTime = addHoursToTime(startTimeStr, assigned);
      assignments.push({
        date: dates[i],
        assignedHours: assigned,
        computedEndTime,
        courseStart: startTimeStr,
      });
      if (remainingHours <= 0) break;
    }
  }

  // Agrupa os dias com mesmo computedEndTime, mês e ano.
  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  type Group = {
    days: number[];
    month: string;
    year: number;
    computedEndTime: string;
    courseStart: string;
  };
  let groups: Group[] = [];

  assignments.forEach((a) => {
    const day = a.date.getDate();
    const monthName = monthNames[a.date.getMonth()];
    const year = a.date.getFullYear();
    const lastGroup = groups[groups.length - 1];
    console.log(day);
    if (
      lastGroup &&
      lastGroup.computedEndTime === a.computedEndTime &&
      lastGroup.month === monthName &&
      lastGroup.year === year
    ) {
      lastGroup.days.push(day);
    } else {
      groups.push({
        days: [day],
        month: monthName,
        year,
        computedEndTime: a.computedEndTime,
        courseStart: a.courseStart,
      });
    }
  });

  // Formata cada grupo para gerar o texto final
  function formatGroup(g: Group): string {
    if (g.days.length === 1) {
      return `no dia ${g.days[0]} de ${g.month} de ${g.year}, das ${g.courseStart} às ${g.computedEndTime}`;
    } else {
      const daysText =
        g.days.length === 2
          ? `${g.days[0]} e ${g.days[1]}`
          : `${g.days.slice(0, -1).join(", ")} e ${g.days[g.days.length - 1]}`;
      return `nos dias ${daysText} de ${g.month} de ${g.year}, das ${g.courseStart} às ${g.computedEndTime}`;
    }
  }

  const groupTexts = groups.map(formatGroup);

  let finalText: string;
  if (groupTexts.length === 1) {
    finalText = groupTexts[0];
  } else if (groupTexts.length === 2) {
    finalText = groupTexts.join(" e ");
  } else {
    finalText =
      groupTexts.slice(0, -1).join(", ") +
      " e " +
      groupTexts[groupTexts.length - 1];
  }

  return finalText;
}
