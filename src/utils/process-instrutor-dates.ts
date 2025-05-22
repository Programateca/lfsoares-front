import { CourseDate } from "@/components/Identificadores";
import { Period } from "./identificador";

// Updated FormData type
type UpdatedFormData = {
  evento: string;
  certificadoTipo: string;
  conteudoAplicado: string;
  participantes: string[];
  assinatura: { titulo?: string; assinante?: string }[]; // assinante is instructorId
  motivoTreinamento?: string;
  objetivoTreinamento?: string;
  // New structure: dateKey -> instructorId -> Period
  instructorPeriodPreferences: Record<
    string,
    Record<string, Period | undefined>
  >;
  address: Record<
    string,
    Partial<Record<"morning" | "afternoon" | "night", string>>
  >;
  // instrutoresPersonalizado might also need an update if used with N instructors.
  // Assuming it's out of scope for this refactor based on the prompt.
  instrutoresPersonalizado: Record<string, { A?: string; B?: string }>;
};

// Output structure for each processed date entry
type ProcessedCourseDateEntry = CourseDate & {
  instrutor: string; // Name of the instructor
};

export function processInstrutorDates({
  data,
  courseDate,
  instrutores, // Master list of {id, name, ...}
}: {
  data: UpdatedFormData; // Using the updated FormData type
  courseDate: string[]; // JSON strings of CourseDate
  instrutores: Array<{ id: string; name: string; [key: string]: any }>;
}): ProcessedCourseDateEntry[] {
  console.log("courseDate", courseDate);
  const result: ProcessedCourseDateEntry[] = [];

  const configuredInstructorIdsFromSignature = data.assinatura
    .map((sig) => sig.assinante)
    .filter((id): id is string => !!id);

  for (const itemStr of courseDate) {
    const item = JSON.parse(itemStr) as CourseDate;
    const dateKey = item.date;
    const preferencesForDateByInstructorId =
      data.instructorPeriodPreferences?.[dateKey] || {};

    let entriesForThisCourseDateItem: ProcessedCourseDateEntry[] = [];
    let instructorHasBeenAssignedThisDay = false;

    const hasBreak = item.intervalStart !== "N/A" && item.intervalEnd !== "N/A";

    for (const instructorId of configuredInstructorIdsFromSignature) {
      const assignedPeriod = preferencesForDateByInstructorId[instructorId];
      const instructorInfo = instrutores.find((i) => i.id === instructorId);

      if (!instructorInfo || !assignedPeriod || assignedPeriod === "nenhum") {
        continue; // No assignment or no info for this instructor on this date/period
      }

      const instrutorName = instructorInfo.name;
      instructorHasBeenAssignedThisDay = true;

      if (hasBreak) {
        if (assignedPeriod === "manha") {
          entriesForThisCourseDateItem.push({
            ...item,
            start: item.start,
            end: item.intervalStart!,
            instrutor: instrutorName,
          });
        } else if (assignedPeriod === "tarde" || assignedPeriod === "noite") {
          entriesForThisCourseDateItem.push({
            ...item,
            start: item.intervalEnd!,
            end: item.end,
            instrutor: instrutorName,
          });
        } else if (
          ["manhaTarde", "manhaNoite", "tardeNoite"].includes(assignedPeriod)
        ) {
          entriesForThisCourseDateItem.push({
            ...item,
            start: item.start,
            end: item.intervalStart!,
            instrutor: instrutorName,
          });
          entriesForThisCourseDateItem.push({
            ...item,
            start: item.intervalEnd!,
            end: item.end,
            instrutor: instrutorName,
          });
        }
      } else {
        // No break: instructor teaches the full duration of the item for any valid period.
        entriesForThisCourseDateItem.push({
          ...item,
          instrutor: instrutorName,
        });
      }
    }

    // Default instructor logic if no specific assignments were made from preferences,
    // but instructors are configured in signatures.
    if (!instructorHasBeenAssignedThisDay) {
      if (configuredInstructorIdsFromSignature.length > 0) {
        // If no one was specifically assigned a working period (e.g., "manha", "tarde"),
        // it means all selected instructors effectively had "nenhum" or an undefined preference for this date.
        // Instead of defaulting to the first instructor, reflect this general lack of specific assignment.
        entriesForThisCourseDateItem.push({
          ...item,
          // This string will indicate that while instructors might be generally available for the course,
          // none were assigned a specific working period on this particular day/item.
          // The `identificador.ts` `sortData` function will then place this string in the `instrutores` array.
          instrutor: "Nenhum Instrutor Designado para este período",
        });
      } else {
        // No instructors configured via data.assinatura at all for the course.
        entriesForThisCourseDateItem.push({
          ...item,
          instrutor: "Nenhum Instrutor Configurado", // Changed for clarity
        });
      }
    }

    result.push(...entriesForThisCourseDateItem);
  }

  return result;
}
