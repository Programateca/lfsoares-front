import { CourseDate } from "@/components/Identificadores";
import { Period } from "./identificador";

type FormData = {
  evento: string;
  certificadoTipo: string;
  conteudoAplicado: string;
  participantes: string[];
  assinatura: { titulo?: string; assinante?: string }[];
  motivoTreinamento?: string;
  objetivoTreinamento?: string;
  instrutorA: Record<string, { periodo?: Period }>;
  instrutorB: Record<string, { periodo?: Period }>;
  address: Record<
    string,
    Partial<Record<"morning" | "afternoon" | "night", string>>
  >;
  instrutoresPersonalizado: Record<string, { A?: string; B?: string }>;
};

export function processInstrutorDates({
  instrutoresSelecionados,
  data,
  courseDate,
  instrutores,
  signatureCount,
}: {
  instrutoresSelecionados: {
    instrutorA: string;
    instrutorB: string;
  };
  data: FormData;
  courseDate: string[];
  instrutores: any[];
  signatureCount: number;
}) {
  console.log("data.instrutoresPersonalizado", data.instrutoresPersonalizado);
  return courseDate.flatMap((itemStr) => {
    // Parse the JSON string to an object.
    const parsedItem = JSON.parse(itemStr);

    const item: CourseDate & {
      morning?: string;
      afternoon?: string;
      night?: string;
    } = parsedItem;
    const currentDateKey = item.date;
    if (data.address && data.address[currentDateKey]) {
      const dailyAddresses = data.address[currentDateKey];

      for (const period of ["morning", "afternoon", "night"] as const) {
        const addressForPeriod = dailyAddresses[period]; // addressForPeriod is string | undefined
        if (addressForPeriod) {
          item[period] = addressForPeriod;
        }
      }
    }

    console.log("item", item);

    const dateKey = item.date;
    const instrutorAPeriodo = data.instrutorA?.[dateKey]?.periodo;
    const instrutorBPeriodo = data.instrutorB?.[dateKey]?.periodo;
    if (!instrutorAPeriodo && !instrutorBPeriodo && signatureCount > 2) {
      throw new Error("Nenhum periodo selecionado para o dia");
    }

    const hasBreak = item.intervalStart !== "N/A" && item.intervalEnd !== "N/A";

    const defaultInstrutor = instrutores.find(
      (instrutor) => instrutor.id === data.assinatura[0]?.assinante
    );

    // Case 1: Split day if break exists and different instructors for morning/afternoon
    if (hasBreak) {
      // Case 1a: Split day with break - A morning, B afternoon
      if (
        (instrutorAPeriodo === "manha" && instrutorBPeriodo === "tarde") ||
        (instrutorAPeriodo === "manha" && instrutorBPeriodo === "noite") ||
        (instrutorAPeriodo === "tarde" && instrutorBPeriodo === "noite")
      ) {
        return [
          {
            ...item,
            start: item.start,
            end: item.intervalStart,
            instrutor: instrutoresSelecionados.instrutorA,
            instrutorA: true,
            instrutorB: false,
          },
          {
            ...item,
            start: item.intervalEnd,
            end: item.end,
            instrutor: instrutoresSelecionados.instrutorB,
            instrutorA: false,
            instrutorB: true,
          },
        ];
      }
      // Case 1b: Split day with break - B morning, A afternoon
      if (
        (instrutorAPeriodo === "tarde" && instrutorBPeriodo === "manha") ||
        (instrutorAPeriodo === "noite" && instrutorBPeriodo === "tarde")
      ) {
        return [
          {
            ...item,
            start: item.start,
            end: item.intervalStart,
            instrutor: instrutoresSelecionados.instrutorB,
            instrutorA: false,
            instrutorB: true,
          },
          {
            ...item,
            start: item.intervalEnd,
            end: item.end,
            instrutor: instrutoresSelecionados.instrutorA,
            instrutorA: true,
            instrutorB: false,
          },
        ];
      }
      // Note: Night period is not typically split by a midday break in this logic.
      // If other break types exist (e.g., evening break), more complex logic is needed.
    }

    // Case 2: Full day, combined periods, single periods, or default
    const resultItem: CourseDate & {
      instrutor?: string;
      instrutorA?: boolean;
      instrutorB?: boolean;
    } = { ...item };

    // Check combined periods first (A takes precedence if both have combined)
    if (
      instrutorAPeriodo === "manhaTarde" ||
      instrutorAPeriodo === "manhaNoite" ||
      instrutorAPeriodo === "tardeNoite"
    ) {
      resultItem.instrutor = instrutoresSelecionados.instrutorA;
    } else if (
      instrutorBPeriodo === "manhaTarde" ||
      instrutorBPeriodo === "manhaNoite" ||
      instrutorBPeriodo === "tardeNoite"
    ) {
      resultItem.instrutor = instrutoresSelecionados.instrutorB;
    }
    // Check single periods if no combined period was assigned (A takes precedence)
    else if (
      instrutorAPeriodo === "manha" ||
      instrutorAPeriodo === "tarde" ||
      instrutorAPeriodo === "noite"
    ) {
      resultItem.instrutor = instrutoresSelecionados.instrutorA;
    } else if (
      instrutorBPeriodo === "manha" ||
      instrutorBPeriodo === "tarde" ||
      instrutorBPeriodo === "noite"
    ) {
      resultItem.instrutor = instrutoresSelecionados.instrutorB;
    } else {
      // Default case (both 'nenhum' or no specific assignment)
      if (defaultInstrutor) {
        resultItem.instrutor = defaultInstrutor.name;
      } else {
        // Handle case where default instructor isn't found
        console.error("Default instructor not found!");
        resultItem.instrutor = "Instrutor Padrão Não Encontrado";
      }
    }

    // If both instructors are assigned to the same full day (e.g., one manhaTarde, other selected but not manhaTarde)
    // This logic might need refinement based on exact desired behavior for overlapping assignments
    if (
      instrutorAPeriodo &&
      instrutorAPeriodo !== "nenhum" &&
      instrutorBPeriodo &&
      instrutorBPeriodo !== "nenhum" &&
      instrutorAPeriodo !== "manhaTarde" &&
      instrutorBPeriodo !== "manhaTarde" &&
      !hasBreak
    ) {
      // If not split and both have some period, prioritize A? Or show both? Current logic prioritizes based on order above.
      // For now, let's assume the above logic handles the priority (A first, then B).
      // If specific dual assignment is needed for a single entry, add logic here.
      // Example: resultItem.instrutor = `${instrutoresSelecionados.instrutorA} / ${instrutoresSelecionados.instrutorB}`;
      //          resultItem.instrutorA = true; resultItem.instrutorB = true;
    }

    return [resultItem]; // Return as array for flatMap
  }) as (CourseDate & {
    instrutor?: string;
  })[];
}
