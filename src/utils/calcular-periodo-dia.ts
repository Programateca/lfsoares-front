type Period =
  | "manha"
  | "tarde"
  | "noite"
  | "manhaTarde"
  | "manhaNoite"
  | "tardeNoite";

export function calcularPeriodoDia(start: string, end: string): Period {
  const parseTime = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(":")) return NaN;
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    )
      return NaN;
    return hours + minutes / 60.0;
  };

  const startTime = parseTime(start);
  const endTime = parseTime(end);

  if (isNaN(startTime) || isNaN(endTime)) {
    console.warn(
      `Invalid or missing time format encountered: start=${start}, end=${end}`
    );
    throw new Error(
      `Invalid or missing time format encountered: start=${start}, end=${end}`
    );
  }

  const midday = 12.0;
  const evening = 18.0;

  const startsBeforeMidday = startTime < midday;
  const startsBeforeEvening = startTime < evening;
  const startsAfterEvening = startTime >= evening;

  const endsBeforeMidday = endTime <= midday;
  const endsBeforeEvening = endTime <= evening;
  const endsAfterEvening = endTime > evening;

  if (startsBeforeMidday && endsAfterEvening) return "manhaNoite";
  if (startsBeforeEvening && !startsBeforeMidday && endsAfterEvening)
    return "tardeNoite";
  if (startsBeforeMidday && endsBeforeEvening && !endsBeforeMidday)
    return "manhaTarde";
  if (startsBeforeMidday && endsBeforeMidday) return "manha";
  if (startsBeforeEvening && !startsBeforeMidday && endsBeforeEvening)
    return "tarde";
  if (startsAfterEvening) return "noite";

  console.warn(`Unhandled time condition: start=${start}, end=${end}`);
  throw new Error(`Unhandled time condition: start=${start}, end=${end}`);
}
