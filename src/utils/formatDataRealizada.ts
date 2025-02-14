/**
 * Formata dinamicamente o trecho de data e horário de realização do treinamento,
 * distribuindo a carga horária total pelos dias do período e agrupando dias com o mesmo horário final.
 *
 * @param courseDate - Data de início ("YYYY-MM-DD" ou array ["YYYY", "MM", "DD"])
 * @param completionDate - Data de término ("YYYY-MM-DD" ou array ["YYYY", "MM", "DD"])
 * @param courseTime - Horário padrão do dia no formato "HH:MM ÀS HH:MM"
 * @param courseHours - Carga horária total do treinamento (em horas, como string, ex: "20")
 * @returns Texto formatado dinamicamente conforme a distribuição das horas e agrupamento dos dias.
 */
export function formatDataRealizada(
  courseDate: string | string[],
  completionDate: string | string[],
  courseTime: string,
  courseHours: string
): string {
  console.log({
    courseDate,
    completionDate,
    courseTime,
    courseHours,
  });
  // Função auxiliar para construir uma data sem problemas de fuso horário.
  function buildDate(dateInput: string | string[]): Date {
    // Se for array:
    if (Array.isArray(dateInput)) {
      // Se o array tem apenas um item e esse item contém "/", assumimos que está no formato dd/MM/yyyy
      if (dateInput.length === 1 && dateInput[0].includes("/")) {
        const [day, month, year] = dateInput[0].split("/");
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
      // Caso contrário, assume que está no formato [YYYY, MM, DD]
      const [year, month, day] = dateInput;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    // Se for string
    if (dateInput.includes("/")) {
      // Formato dd/MM/yyyy
      const [day, month, year] = dateInput.split("/");
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    // Caso padrão: assume o formato "YYYY-MM-DD"
    const [year, month, day] = dateInput.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const startDateObj = buildDate(courseDate);
  const endDateObj = buildDate(completionDate);

  // Calcula o número de dias no período (inclusivo)
  const diffTime = endDateObj.getTime() - startDateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;

  // Gera um array com todas as datas do período
  let dates: Date[] = [];
  for (let i = 0; i < diffDays; i++) {
    let d = new Date(startDateObj);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  // Extrai os horários padrão do dia
  const [startTimeStr, fullEndTimeStr] = courseTime
    .split("ÀS")
    .map((s) => s.trim());
  const [startHour, startMin] = startTimeStr.split(":").map(Number);
  const [endHour, endMin] = fullEndTimeStr.split(":").map(Number);
  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;

  // Duração padrão do dia (em horas)
  const defaultDayDuration = (endTimeMinutes - startTimeMinutes) / 60;
  let remainingHours = Number(courseHours);

  // Distribui as horas entre os dias disponíveis
  type DayAssignment = { date: Date; assignedHours: number };
  let assignments: DayAssignment[] = [];
  for (let i = 0; i < dates.length; i++) {
    let assigned: number;
    if (remainingHours >= defaultDayDuration) {
      assigned = defaultDayDuration;
    } else {
      assigned = remainingHours;
    }
    assignments.push({ date: dates[i], assignedHours: assigned });
    remainingHours -= assigned;
    if (remainingHours <= 0) break;
  }

  // Função auxiliar para somar horas (em decimal) ao horário de início e retornar horário formatado "HH:MM"
  function addHoursToTime(timeMinutes: number, hoursToAdd: number): string {
    const totalMinutes = timeMinutes + Math.round(hoursToAdd * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  // Calcula o horário final de cada atribuição
  const assignmentsWithComputed = assignments.map((a) => {
    const computedEndTime = addHoursToTime(startTimeMinutes, a.assignedHours);
    return { ...a, computedEndTime };
  });

  // Array com os nomes dos meses para formatação
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

  // Agrupa os dias que possuem o mesmo horário final, e que estejam no mesmo mês/ano.
  type Group = {
    days: number[];
    month: string;
    year: number;
    computedEndTime: string;
  };
  let groups: Group[] = [];
  assignmentsWithComputed.forEach((a) => {
    const day = a.date.getDate();
    const monthName = monthNames[a.date.getMonth()];
    const year = a.date.getFullYear();
    if (groups.length === 0) {
      groups.push({
        days: [day],
        month: monthName,
        year,
        computedEndTime: a.computedEndTime,
      });
    } else {
      const lastGroup = groups[groups.length - 1];
      if (
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
        });
      }
    }
  });

  // Função auxiliar para formatar cada grupo
  function formatGroup(g: Group): string {
    console.log(g);
    if (g.days.length === 1) {
      return `no dia ${g.days[0]} de ${g.month} de ${g.year}, das ${startTimeStr} às ${g.computedEndTime}`;
    } else {
      let daysText: string;
      if (g.days.length === 2) {
        daysText = `${g.days[0]} e ${g.days[1]}`;
      } else {
        daysText =
          g.days.slice(0, -1).join(", ") + " e " + g.days[g.days.length - 1];
      }
      return `nos dias ${daysText} de ${g.month} de ${g.year}, das ${startTimeStr} às ${g.computedEndTime}`;
    }
  }

  const groupTexts = groups.map(formatGroup);

  // Junta os textos dos grupos
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
