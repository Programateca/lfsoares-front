/**
 * Formata dinamicamente o trecho de data e horário de realização do treinamento,
 * agrupando dias com o mesmo horário de início e término conforme informado.
 *
 * @param datasRealizada - Array de JSON strings com dados detalhados de cada dia.
 * @returns Texto formatado conforme agrupamento dos dias por horário.
 */
export function formatDataRealizada(datasRealizada: string[]): string {
  type DayData = {
    date: string; // formato "yyyy-MM-dd"
    start: string; // "HH:MM"
    end: string; // "HH:MM"
    intervalStart?: string; // opcional, ignorado no agrupamento
    intervalEnd?: string; // opcional, ignorado no agrupamento
  };

  // Converte JSON strings em objetos e ordena por data
  const daysData: DayData[] = datasRealizada
    .map((jsonStr) => JSON.parse(jsonStr) as DayData)
    .sort((a, b) => {
      const [ay, am, ad] = a.date.split("-").map(Number);
      const [by, bm, bd] = b.date.split("-").map(Number);
      return (
        new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime()
      );
    });

  // Mapeia para data JS e horários originais
  type Slot = { date: Date; start: string; end: string };
  const slots: Slot[] = daysData.map((d) => {
    const [yy, mm, dd] = d.date.split("-").map(Number);
    return { date: new Date(yy, mm - 1, dd), start: d.start, end: d.end };
  });

  // Agrupa dias que compartilham o mesmo horário início/fim
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
    start: string;
    end: string;
  };
  const groups: Group[] = [];

  for (const slot of slots) {
    const dayNum = slot.date.getDate();
    const mon = monthNames[slot.date.getMonth()];
    const yr = slot.date.getFullYear();
    const last = groups[groups.length - 1];

    if (
      last &&
      last.start === slot.start &&
      last.end === slot.end &&
      last.month === mon &&
      last.year === yr
    ) {
      last.days.push(dayNum);
    } else {
      groups.push({
        days: [dayNum],
        month: mon,
        year: yr,
        start: slot.start,
        end: slot.end,
      });
    }
  }

  // Função para formatar cada grupo de dias
  function fmtGroup(g: Group): string {
    const daysText =
      g.days.length > 1
        ? g.days.slice(0, -1).join(", ") + " e " + g.days[g.days.length - 1]
        : `${g.days[0]}`;
    const prefix = g.days.length > 1 ? "nos dias" : "no dia";
    return `${prefix} ${daysText} de ${g.month} de ${g.year}, das ${g.start} às ${g.end}`;
  }

  const parts = groups.map(fmtGroup);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(" e ");
  return parts.slice(0, -1).join(", ") + " e " + parts[parts.length - 1];
}
