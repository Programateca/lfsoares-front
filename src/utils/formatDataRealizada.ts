/**
 * Formata dinamicamente o trecho de data e horário de realização do treinamento,
 * distribuindo a carga horária total pelos dias informados e agrupando dias com o mesmo horário final.
 *
 * @param courseDate - Array de datas (como string, em formato "dd/MM/yyyy" ou "yyyy-MM-dd")
 * @param courseTime - Horário padrão do dia no formato "HH:MM ÀS HH:MM"
 * @param courseHours - Carga horária total do treinamento (em horas, como string, ex: "20")
 * @returns Texto formatado conforme a distribuição das horas e agrupamento dos dias.
 */
export function formatDataRealizada(
  courseDate: string | string[],
  courseTime: string,
  courseHours: string
): string {
  // Converte o parâmetro para um array de strings, caso seja uma única string.
  let dateStrings: string[] =
    typeof courseDate === "string" ? [courseDate] : courseDate;

  // Converte cada data para um objeto Date, considerando os formatos "dd/MM/yyyy" ou "yyyy-MM-dd"
  const dates: Date[] = dateStrings.map((d) => {
    if (d.includes("/")) {
      const [day, month, year] = d.split("/");
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    const [year, month, day] = d.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  });

  // Ordena as datas em ordem crescente
  dates.sort((a, b) => a.getTime() - b.getTime());

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

  // Distribui as horas entre os dias informados
  type DayAssignment = { date: Date; assignedHours: number };
  let assignments: DayAssignment[] = [];
  for (let i = 0; i < dates.length; i++) {
    const assigned =
      remainingHours >= defaultDayDuration
        ? defaultDayDuration
        : remainingHours;
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
    // Se o grupo atual tem mesmo horário final, mês e ano, adiciona o dia, senão cria um novo grupo
    const lastGroup = groups[groups.length - 1];
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
      });
    }
  });

  // Função auxiliar para formatar cada grupo
  function formatGroup(g: Group): string {
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
