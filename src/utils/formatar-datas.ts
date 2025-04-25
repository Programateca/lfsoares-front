export function formatarDatas(dates: string[]): string {
  const formatado: Record<string, string[]> = {};

  dates.forEach((date) => {
    let day: string, month: string, year: string;

    if (date.includes("-")) {
      // Se estiver no formato "yyyy-MM-dd"
      const [y, m, d] = date.split("-");
      year = y;
      month = m;
      day = d;
    } else {
      // Assume o formato "dd/MM/yyyy"
      [day, month, year] = date.split("/");
    }

    // Converter para o formato "dd/MM/yyyy" se necessário (aqui só usamos month e ano)
    const monthYear = `${month}/${year}`;
    if (!formatado[monthYear]) {
      formatado[monthYear] = [];
    }
    formatado[monthYear].push(day);
  });

  const resultado: string[] = [];
  for (const [monthYear, days] of Object.entries(formatado)) {
    // Ordenar os dias numericamente
    days.sort((a, b) => parseInt(a) - parseInt(b));
    const lastDay = days.pop();
    if (days.length > 0) {
      resultado.push(`${days.join(", ")} E ${lastDay}/${monthYear}`);
    } else if (lastDay) {
      resultado.push(`${lastDay}/${monthYear}`);
    }
  }

  return resultado.join(", ");
}
