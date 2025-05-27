import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Controller, useForm } from "react-hook-form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { api } from "@/lib/axios";

import { Evento } from "@/@types/Evento";
import { Pessoa } from "@/@types/Pessoa";
import { Instrutor } from "@/@types/Instrutor";

import { MultiSelect } from "@/components/multi-select";
import { gerarIdentificador } from "@/utils/identificador";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";
import { IdentificadorData } from "@/@types/IdentificadorData";
import { useAuth } from "@/context/AuthContextProvider";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { formatarDatas } from "@/utils/formatar-datas";
import { fillParticipants } from "@/utils/preencher-participantes-identificador";
import { CourseData } from "@/@types/Identificador";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type SinglePeriod = "manha" | "tarde" | "noite";
type CombinedPeriod = "manhaTarde" | "manhaNoite" | "tardeNoite";
type ValidPeriod = SinglePeriod | CombinedPeriod | "nenhum";

const periodSchema = z
  .enum([
    "nenhum",
    "manha",
    "tarde",
    "noite",
    "manhaTarde",
    "manhaNoite",
    "tardeNoite",
    "",
  ])
  .optional()
  .default("nenhum");

const instructorConfigSchema = z
  .object({
    instrutor: z.string().optional(), // Assuming name is stored, change if ID
    periodo: periodSchema,
  })
  .refine(
    (data) => {
      // Removed check against "", as periodSchema does not include it as a valid enum value.
      if (data.periodo && data.periodo !== "nenhum") {
        return data.instrutor && data.instrutor.trim() !== "";
      }
      return true;
    },
    {
      message:
        "Instrutor é obrigatório se um período (diferente de Nenhum) for selecionado.",
      path: ["instrutor"],
    }
  );

const courseDateDetailSchema = z
  .object({
    addressMode: z.enum(["single", "individual"]).default("individual"),
    singleAddress: z.string().optional(),
    address: z.object({
      morning: z.string().optional(),
      afternoon: z.string().optional(),
      night: z.string().optional(),
    }),
    instrutorA: instructorConfigSchema,
    instrutorB: instructorConfigSchema,
  })
  .refine(
    (data) => {
      const periodA_val = data.instrutorA.periodo || "nenhum"; // Default to "nenhum" if undefined
      const periodB_val = data.instrutorB.periodo || "nenhum"; // Default to "nenhum" if undefined

      const periodsA = getBasePeriodsLocal(periodA_val as ValidPeriod);
      const periodsB = getBasePeriodsLocal(periodB_val as ValidPeriod);

      // Check for overlap
      for (const period of periodsA) {
        if (periodsB.has(period)) {
          return false; // Overlap detected
        }
      }

      const isPaDouble =
        periodA_val === "manhaTarde" ||
        periodA_val === "manhaNoite" ||
        periodA_val === "tardeNoite";
      const isPbDouble =
        periodB_val === "manhaTarde" ||
        periodB_val === "manhaNoite" ||
        periodB_val === "tardeNoite";

      if (isPaDouble && periodB_val !== "nenhum") return false;
      if (isPbDouble && periodA_val !== "nenhum") return false;

      return true;
    },
    {
      message:
        "Configuração de período inválida. Verifique sobreposições ou a regra: se um instrutor cobre dois períodos (ex: Manhã e Tarde), o outro deve ter 'Nenhum'. Se um cobre um período, o outro pode cobrir um período diferente (não sobreposto).",
    }
  )
  .superRefine((data, ctx) => {
    const activePeriods: SinglePeriod[] = [];
    const periodsA = getBasePeriodsLocal(
      data.instrutorA.periodo as ValidPeriod
    );
    const periodsB = getBasePeriodsLocal(
      data.instrutorB.periodo as ValidPeriod
    );
    periodsA.forEach((p) => activePeriods.push(p));
    periodsB.forEach((p) => {
      if (!activePeriods.includes(p)) {
        activePeriods.push(p);
      }
    });

    if (data.addressMode === "single") {
      if (!data.singleAddress || data.singleAddress.trim() === "") {
        if (activePeriods.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "O endereço único é obrigatório quando há períodos ativos.",
            path: ["singleAddress"],
          });
        }
      }
    } else {
      // addressMode === "individual"
      if (
        activePeriods.includes("manha") &&
        (!data.address.morning || data.address.morning.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Endereço da manhã é obrigatório.",
          path: ["address", "morning"],
        });
      }
      if (
        activePeriods.includes("tarde") &&
        (!data.address.afternoon || data.address.afternoon.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Endereço da tarde é obrigatório.",
          path: ["address", "afternoon"],
        });
      }
      if (
        activePeriods.includes("noite") &&
        (!data.address.night || data.address.night.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Endereço da noite é obrigatório.",
          path: ["address", "night"],
        });
      }
    }
  });

// Renamed original formDataSchema to createFormDataSchema and made it a function
const createFormDataSchema = (signatureCount: number) => {
  return z.object({
    evento: z.string().min(1, "Selecione um evento"),
    certificadoTipo: z.string().min(1, "Tipo de certificado é obrigatório"),
    conteudoAplicado: z.string().optional(),
    participantes: z
      .array(z.string())
      .min(1, "Selecione ao menos um participante"),
    assinatura: z
      .array(
        z.object({
          titulo: z.string().optional(),
          assinante: z.string().optional(),
        })
      )
      .refine(
        (data) => {
          return data.every(
            (sig) =>
              (sig.titulo && sig.assinante) || (!sig.titulo && !sig.assinante)
          );
        },
        {
          message:
            "Assinante é obrigatório se o título da assinatura estiver preenchido",
          path: ["root"], // Apply error to the array itself
        }
      ),
    motivoTreinamento: z.string().optional(),
    objetivoTreinamento: z.string().optional(),
    // Conditionally define courseDate schema based on signatureCount
    courseDate:
      signatureCount < 3
        ? z.record(courseDateDetailSchema).optional().default({})
        : z
            .record(courseDateDetailSchema)
            .refine((val) => val && Object.keys(val).length > 0, {
              message:
                "A configuração de datas e instrutores é obrigatória e não pode estar vazia quando há 3 ou mais assinaturas.",
            }),
  });
};

// Update FormData type to infer from the new factory function
type FormData = z.infer<ReturnType<typeof createFormDataSchema>>;

// Helper function to get base periods from a ValidPeriod
const getBasePeriodsLocal = (period: ValidPeriod): Set<SinglePeriod> => {
  const base = new Set<SinglePeriod>();
  if (!period || period === "nenhum") return base; // Removed check against "" as it's no longer in ValidPeriod
  if (period.toLocaleLowerCase().includes("manha")) base.add("manha");
  if (period.toLocaleLowerCase().includes("tarde")) base.add("tarde");
  if (period.toLocaleLowerCase().includes("noite")) base.add("noite");
  return base;
};

export const Identificadores = () => {
  const [signatureCount, setSignatureCount] = useState(0); // Moved up to be available for schema creation

  // Create the schema memoized, based on signatureCount
  const schema = useMemo(
    () => createFormDataSchema(signatureCount),
    [signatureCount]
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting }, // Added errors here
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema), // Use the memoized schema
    defaultValues: {
      evento: "",
      certificadoTipo: "",
      conteudoAplicado: "",
      participantes: [],
      assinatura: [{ titulo: "INSTRUTOR", assinante: undefined }], // Ensure array for signatures
      motivoTreinamento: "",
      objetivoTreinamento: "",
      courseDate: {},
    },
  });

  useEffect(() => {
    const displayErrors = (errorObject: any, pathPrefix = "") => {
      if (errorObject) {
        Object.keys(errorObject).forEach((key) => {
          const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
          if (
            errorObject[key]?.message &&
            typeof errorObject[key].message === "string"
          ) {
            toast.error(`Erro: ${errorObject[key].message}`);
          } else if (key === "root" && errorObject[key]?.message) {
            // Handle root errors specifically for arrays/objects
            toast.error(`Erro: ${errorObject[key].message}`);
          } else if (
            typeof errorObject[key] === "object" &&
            errorObject[key] !== null &&
            !errorObject[key].message
          ) {
            // Check for _errors which zod uses for refine issues not tied to a specific field
            if (
              errorObject[key]._errors &&
              errorObject[key]._errors.length > 0
            ) {
              errorObject[key]._errors.forEach((errMsg: string) => {
                toast.error(`Erro: ${errMsg}`);
              });
            } else {
              displayErrors(errorObject[key], currentPath);
            }
          }
        });
      }
    };
    if (Object.keys(errors).length > 0) {
      // console.log("Zod Errors:", JSON.stringify(errors, null, 2)); // For debugging
      displayErrors(errors);
    }
  }, [errors]);

  const [days, setDays] = useState<
    {
      date: string;
      start: string;
      end: string;
      intervalStart: string;
      intervalEnd: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [formsOpen, setFormsOpen] = useState(false);

  const [showIdentificationConfig, setShowIdentificationConfig] =
    useState(false);
  const [identificadoresGerados, setIdentificadoresGerados] = useState<
    IdentificadorData[]
  >([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) navigate("/login");

  const eventoSelecionado = watch("evento");
  const selectedEvento = eventos.find((ev) => ev.id === eventoSelecionado);

  // Watch all courseDate fields for reactivity
  const watchedCourseDate = watch("courseDate");

  const getAvailablePeriodsForInstructor = (
    otherInstructorPeriod: ValidPeriod,
    daySupports: { morning: boolean; afternoon: boolean; night: boolean }
  ): { value: ValidPeriod; label: string }[] => {
    const initialAvailable: { value: ValidPeriod; label: string }[] = [
      { value: "nenhum", label: "Nenhum" },
    ];

    const allPossiblePeriods: {
      value: ValidPeriod;
      label: string;
      bases: SinglePeriod[];
    }[] = [
      { value: "manha", label: "Manhã", bases: ["manha"] },
      { value: "tarde", label: "Tarde", bases: ["tarde"] },
      { value: "noite", label: "Noite", bases: ["noite"] },
      {
        value: "manhaTarde",
        label: "Manhã e Tarde",
        bases: ["manha", "tarde"],
      },
      {
        value: "manhaNoite",
        label: "Manhã e Noite",
        bases: ["manha", "noite"],
      },
      {
        value: "tardeNoite",
        label: "Tarde e Noite",
        bases: ["tarde", "noite"],
      },
    ];

    const supportedPeriodsForDay = allPossiblePeriods.filter((p) => {
      if (p.value === "nenhum") return false;
      if (p.bases.length === 0) return false;

      for (const base of p.bases) {
        if (base === "manha" && !daySupports.morning) return false;
        if (base === "tarde" && !daySupports.afternoon) return false;
        if (base === "noite" && !daySupports.night) return false;
      }
      return true;
    });

    const otherBasePeriods = getBasePeriodsLocal(otherInstructorPeriod);

    // If the other instructor has a combined period, this instructor can only be "nenhum".
    if (otherBasePeriods.size >= 2) {
      return initialAvailable; // Only "Nenhum"
    }

    const finalAvailable = [...initialAvailable];
    supportedPeriodsForDay.forEach((p) => {
      finalAvailable.push({ value: p.value, label: p.label });
    });
    return finalAvailable;
  };

  const handlePeriodChangeForDay = (
    date: string,
    changedInstructorKey: "instrutorA" | "instrutorB",
    newPeriod: ValidPeriod,
    daySupports: { morning: boolean; afternoon: boolean; night: boolean }
  ) => {
    // 1. Set the value for the instructor whose period was manually changed
    setValue(`courseDate.${date}.${changedInstructorKey}.periodo`, newPeriod, {
      // shouldValidate: signatureCount > 2 ? true : false,
    });

    const otherInstructorKey =
      changedInstructorKey === "instrutorA" ? "instrutorB" : "instrutorA";
    const newPeriodBases = getBasePeriodsLocal(newPeriod);

    const newPeriodBaseCount = newPeriodBases.size;

    if (newPeriodBaseCount >= 2) {
      setValue(`courseDate.${date}.${otherInstructorKey}.periodo`, "nenhum", {
        // shouldValidate: signatureCount > 2 ? true : false,
      });
      return;
    }

    if (newPeriodBaseCount === 1) {
      const newlySelectedSingleBase = Array.from(newPeriodBases)[0];

      const supportedSingleDayPeriods: SinglePeriod[] = [];
      if (daySupports.morning) supportedSingleDayPeriods.push("manha");
      if (daySupports.afternoon) supportedSingleDayPeriods.push("tarde");
      if (daySupports.night) supportedSingleDayPeriods.push("noite");

      if (
        supportedSingleDayPeriods.length === 2 &&
        supportedSingleDayPeriods.includes(newlySelectedSingleBase)
      ) {
        const otherPeriodToAutoAssign = supportedSingleDayPeriods.find(
          (p) => p !== newlySelectedSingleBase
        );
        if (otherPeriodToAutoAssign) {
          setValue(
            `courseDate.${date}.${otherInstructorKey}.periodo`,
            otherPeriodToAutoAssign as ValidPeriod
            // { shouldValidate: signatureCount > 2 ? true : false }
          );
          return;
        }
      }

      // General handling for single period selection (including conflicts):
      const otherInstructorCurrentPeriod =
        getValues(`courseDate.${date}.${otherInstructorKey}.periodo`) ||
        "nenhum";
      const otherInstructorCurrentBases = getBasePeriodsLocal(
        otherInstructorCurrentPeriod
      );

      if (otherInstructorCurrentBases.size >= 2) {
        setValue(`courseDate.${date}.${otherInstructorKey}.periodo`, "nenhum", {
          // shouldValidate: signatureCount > 2 ? true : false,
        });
      } else if (otherInstructorCurrentBases.size === 1) {
        const otherExistingSingleBase = Array.from(
          otherInstructorCurrentBases
        )[0];

        if (otherExistingSingleBase === newlySelectedSingleBase) {
          const potentialShiftsOrder: SinglePeriod[] = [
            "manha",
            "tarde",
            "noite",
          ];
          let shifted = false;
          for (const shiftTarget of potentialShiftsOrder) {
            if (
              shiftTarget !== newlySelectedSingleBase && // Don't shift to the period causing conflict
              supportedSingleDayPeriods.includes(shiftTarget) // Day must support this shift target
            ) {
              setValue(
                `courseDate.${date}.${otherInstructorKey}.periodo`,
                shiftTarget as ValidPeriod
                // { shouldValidate: signatureCount > 2 ? true : false }
              );
              shifted = true;
              break;
            }
          }
          if (!shifted) {
            setValue(
              `courseDate.${date}.${otherInstructorKey}.periodo`,
              "nenhum",
              {
                // shouldValidate: signatureCount > 2 ? true : false,
              }
            );
          }
        }
      }
      return;
    }
  };

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const [showInativos, setShowInativos] = useState(false);

  const fetchData = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("identificadores", {
        params: { page: pageNumber, limit },
      });
      const [eventosResp, pessoasResp, instrutoresResp] = await Promise.all([
        api.get("eventos", { params: { limit: 100000 } }),
        api.get("pessoas", { params: { limit: 100000 } }),
        api.get("instrutores", { params: { limit: 100000 } }),
      ]);

      setHasNextPage(response.data.hasNextPage);
      setIdentificadoresGerados(response.data.data);
      setEventos(eventosResp.data.data.filter((e: any) => e.status.id === 1));
      setParticipantes(
        pessoasResp.data.data.filter((e: any) => e.status.id === 1)
      );
      setInstrutores(instrutoresResp.data.data);
    } catch (error) {
      toast.error("Erro ao buscar dados iniciais");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    // Se for avançar e não houver próxima página, interrompe a navegação
    if (newPage > page && !hasNextPage) {
      toast.error("Não há registros para esta página.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("identificadores", {
        params: { page: newPage, limit },
      });
      setIdentificadoresGerados(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar eventos");
    } finally {
      setLoading(false);
    }
  };

  // Busca pessoas sempre que a página muda
  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleSignatureCount = (value: string) => {
    setShowIdentificationConfig(value !== "2");
    setSignatureCount(Number(value));
  };

  const handleEventoSelect = (eventoId: string) => {
    const evento = eventos.find((ev) => ev.id === eventoId);
    if (!evento) return;

    setDays(evento.courseDate.map((date) => JSON.parse(date)));
  };

  const onSubmit = async (data: FormData) => {
    let transformedCourseData: CourseData[] | null = null;

    if (signatureCount > 2) {
      if (!data.courseDate) {
        toast.error("Erro inesperado.");
        return;
      }
      transformedCourseData = Object.entries(data.courseDate).map(
        ([date, details]) => {
          const dayInfo = days.find((d) => d.date === date);
          if (dayInfo) {
            return {
              ...details,
              date: { ...dayInfo },
            };
          }
          throw new Error("Erro com a data do evento");
        }
      );
    } else {
      transformedCourseData = days.map((day) => {
        const dayStartTime = day.start;
        const dayEndTime = day.end;

        const isMorning = dayStartTime < "12:00" && dayEndTime > "06:00";
        const isAfternoon = dayStartTime < "18:00" && dayEndTime > "12:00";
        const isNight = dayStartTime < "23:59" && dayEndTime > "18:00";

        let instructorAPeriod: string | undefined = undefined;
        if (isMorning && isAfternoon && isNight) {
          instructorAPeriod = undefined; // Full day coverage, specific period string might be ambiguous
        } else if (isMorning && isAfternoon) {
          instructorAPeriod = "manhaTarde";
        } else if (isMorning && isNight) {
          instructorAPeriod = "manhaNoite";
        } else if (isAfternoon && isNight) {
          instructorAPeriod = "tardeNoite";
        } else if (isMorning) {
          instructorAPeriod = "manha";
        } else if (isAfternoon) {
          instructorAPeriod = "tarde";
        } else if (isNight) {
          instructorAPeriod = "noite";
        }

        const courseDayAddress: {
          morning?: string;
          afternoon?: string;
          night?: string;
        } = {};

        if (selectedEvento?.courseLocation) {
          if (isMorning)
            courseDayAddress.morning = selectedEvento.courseLocation;
          if (isAfternoon)
            courseDayAddress.afternoon = selectedEvento.courseLocation; // Ensure selectedEvento is used
          if (isNight) courseDayAddress.night = selectedEvento.courseLocation; // Ensure selectedEvento is used
        }

        return {
          address: courseDayAddress,
          date: { ...day },
          instrutorA: {
            instrutor: getAssinante(0, false),
            periodo: instructorAPeriod,
          },
          instrutorB: {}, // Assuming instrutorB is not applicable or empty for this case
        };
      });
    }

    const isCourseDataValid = transformedCourseData.every((courseDate) => {
      if (
        courseDate.instrutorA?.periodo !== "nenhum" &&
        (!courseDate.instrutorA?.instrutor ||
          courseDate.instrutorA?.instrutor === "")
      ) {
        return false;
      }
      if (
        courseDate.instrutorB?.periodo !== "nenhum" &&
        (!courseDate.instrutorB?.instrutor ||
          courseDate.instrutorB?.instrutor === "")
      ) {
        return false;
      }
      return (
        courseDate.instrutorA?.periodo !== "nenhum" ||
        courseDate.instrutorB?.periodo !== "nenhum"
      );
    });

    if (!isCourseDataValid) {
      toast.error(
        "Pelo menos um instrutor deve estar alocado em cada período do curso."
      );
      return;
    }

    if (!data.participantes?.length) {
      toast.error("Selecione os participantes");
      return;
    }

    if (!selectedEvento) {
      toast.error("Evento selecionado não foi encontrado!");
      return;
    }

    const fullYear = new Date().getFullYear().toString();
    const certificadoCode = Number(
      (await api.get(`identificadores/last-certificado-code/${fullYear}`)).data
    );

    const datasArray: string[] = selectedEvento.courseDate.map(
      (dateStr) => JSON.parse(dateStr).date
    );

    const datasFormatadas = formatarDatas(datasArray);

    const fullDateNow = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let conteudoAplicado = "";
    if (data.conteudoAplicado) {
      conteudoAplicado = data.conteudoAplicado;
    } else if (selectedEvento.treinamento.conteudoAplicado) {
      conteudoAplicado = selectedEvento.treinamento.conteudoAplicado;
    }

    function getAssinante(index: number, full = true) {
      const instrutor = instrutores.find(
        (item) =>
          data.assinatura[index]?.assinante &&
          item.id === data.assinatura[index].assinante
      );
      if (!instrutor) {
        return " ";
      }
      if (!full) return instrutor.name.trim();
      return `${instrutor.name} - ${instrutor.qualificacaoProfissional} - ${instrutor.registroProfissional}`;
    }

    const courseDateItens = selectedEvento?.courseDate.map((itemStr) =>
      JSON.parse(itemStr)
    );

    const horariosSet = new Set<string>();
    const intervalosSet = new Set<string>();

    courseDateItens?.forEach((item) => {
      if (item.intervalStart !== "N/A" || item.intervalEnd !== "N/A") {
        intervalosSet.add(`${item.intervalStart} ÀS ${item.intervalEnd}`);
        horariosSet.add(`${item.start} ÀS ${item.end}`);
      } else {
        horariosSet.add(`${item.start} ÀS ${item.end}`);
      }
    });

    const horarios = Array.from(horariosSet).join(" E ");
    const intervalos = intervalosSet.size
      ? Array.from(intervalosSet).join(" E ")
      : "N/A";

    const participantesMap = fillParticipants(
      data,
      participantes,
      certificadoCode,
      parseInt(fullYear)
    );
    const totalParticipants = data.participantes.length;

    const dataGerador = {
      // Header
      header_revisao: "LUIS FERNANDO SOARES", // Nome de quem revisou
      header_data: "14/02/2025",
      revisao: "00", // Added comma
      // Fim Header
      ...(() => {
        const defaultSignatureProps = {
          titulo2: "",
          nome2: "",
          qualificacao_profissional2: "",
          registro_profissional2: "",
        };

        if (!Array.isArray(data?.assinatura) || data.assinatura.length === 0) {
          return defaultSignatureProps;
        }

        const lastFilledAssinatura = [...data.assinatura]
          .reverse()
          .find((sig) => sig?.assinante);

        if (!lastFilledAssinatura) {
          return defaultSignatureProps;
        }

        const instrutor = instrutores.find(
          (item) => item.id === lastFilledAssinatura.assinante
        );

        return {
          titulo2: lastFilledAssinatura.titulo || "",
          nome2: instrutor ? `${instrutor.name}:` : "",
          qualificacao_profissional2: instrutor?.qualificacaoProfissional || "",
          registro_profissional2: instrutor?.registroProfissional || "",
        };
      })(), // Added comma

      is_short_course: selectedEvento?.treinamento?.courseHours,
      modulo: selectedEvento?.treinamento.courseMethodology,
      horarios: horarios,
      id_data: fullDateNow.replace(/\//g, "."), // Troca / por . para seguir o padrão apresentado pelo modelo deles
      responsavel_tecnico: "", // Deixa vazio pq não precisava desse campo e se tirar fica undefined XD

      ...participantesMap,
      numeroParticipantes: totalParticipants,

      conteudo_aplicado: conteudoAplicado,
      motivo_treinamento: data.motivoTreinamento,
      objetivo_lf: data.objetivoTreinamento,
      treinamento: selectedEvento.treinamento.name,
      treinamento_lista: selectedEvento.treinamento.name,
      evento_id: selectedEvento.id,
      contratante: `${selectedEvento.empresa.name} - CNPJ:${
        selectedEvento.empresa.cnpj ? selectedEvento.empresa.cnpj : ""
      }`,
      tipo: selectedEvento.treinamento.courseType,
      carga_horaria: `${selectedEvento.treinamento.courseHours} HORAS/AULA`,
      intervalo: intervalos,
      endereco: selectedEvento.courseLocation || "",
      endereco2: selectedEvento?.courseLocation2 || "",
      empresa: `${selectedEvento.empresa.name} - ${
        selectedEvento.empresa.cnpj ? selectedEvento.empresa.cnpj : ""
      }`,
      empresa_id: selectedEvento.empresa.id,
      datas: datasFormatadas.split(";")[0],
      tipo_certificado: data.certificadoTipo,

      // Assinaturas
      assinante_titulo1: data?.assinatura[0]?.titulo || "",
      assinante_titulo2: data?.assinatura[1]?.titulo || "",
      assinante_titulo3: data?.assinatura[2]?.titulo || "",
      assinante_titulo4: data?.assinatura[3]?.titulo || "",

      assinante1: getAssinante(0),
      assinante2: getAssinante(1),
      assinante3: getAssinante(2),
      assinante4: getAssinante(3),
      courseData: transformedCourseData,
    };

    // FOR DEBUG
    // console.log("dataGerador.courseData", transformedCourseData);
    // gerarIdentificador(
    //   {
    //     ...(dataGerador as any),
    //     id_code: "teste",
    //   },
    //   dataGerador.courseData,
    //   dataGerador.numeroParticipantes
    // );
    // return;

    const newIdentificador: Partial<IdentificadorData> = {
      treinamento: selectedEvento.treinamento.name,
      identificadorData: JSON.stringify(dataGerador),
      year: String(fullYear),
    };

    const saveResponse = await api.post("identificadores", newIdentificador);
    if (saveResponse.status === 201) {
      toast.success("Identificador gerado com sucesso!");
      setIdentificadoresGerados((prev) => [
        ...prev,
        saveResponse.data as IdentificadorData,
      ]);
      setFormsOpen(false);
    } else {
      toast.error("Erro ao gerar identificador!");
    }
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    inicializarFetch();
  }, [formsOpen]);

  const handleUpdateStatus = async (id: string | number, status: number) => {
    try {
      await api.patch(`identificadores/${id}`, {
        status: {
          id: status,
        },
      });
      toast(
        status === 1 ? "Identificador ativado!" : "Identificador desativado!",
        {
          icon: status === 1 ? "🚀" : "🗑️",
          duration: 2000,
        }
      );
      fetchData();
    } catch (error) {
      console.error("Erro ao atualizar o status do identificador:", error);
      setIdentificadoresGerados((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: { id: status } } : item
        )
      );
    }
  };

  const filteredData = showInativos
    ? identificadoresGerados.filter((p) => p.status?.id === 2)
    : identificadoresGerados.filter((p) => p.status?.id === 1);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">
          Lista de Identificadores
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Botão para mostrar/ocultar formulário */}
        <div className="flex justify-between mb-4">
          <Button
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
            onClick={() => {
              setFormsOpen((prev) => !prev);
              reset();
              setSignatureCount(0);
              setShowIdentificationConfig(false);
            }}
          >
            {formsOpen ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Tabela
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Gerar novo Identificador
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowInativos((prev) => !prev)}
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
          >
            {showInativos ? "Ocultar Inativos" : "Mostrar Inativos"}
          </Button>
        </div>

        {/* Formulário de Criação/Edição */}
        {formsOpen ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Linha de Seleção de Evento e Certificado */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="w-full">
                <Label>Evento</Label>
                <Controller
                  name="evento"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleEventoSelect(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um Evento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Eventos</SelectLabel>
                          {eventos.map((evento: Evento) => (
                            <SelectItem key={evento.id} value={evento.id}>
                              {evento.titulo}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="w-full">
                <Label>Tipo de Certificado</Label>
                <Controller
                  name="certificadoTipo"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleSignatureCount(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de certificado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Certificados</SelectLabel>
                          <SelectItem value="2">
                            Certificado de 2 assinaturas
                          </SelectItem>
                          <SelectItem value="3">
                            Certificado de 3 assinaturas
                          </SelectItem>
                          <SelectItem value="4">
                            Certificado de 4 assinaturas
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Linha de assinaturas e conteúdo aplicado */}
            <div className="my-4 flex flex-col md:flex-row gap-4">
              <div className="w-full">
                {Array.from({ length: signatureCount }).map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-start md:items-end gap-2 mb-3"
                  >
                    <Label className="md:pb-4 whitespace-nowrap">
                      Assinatura {index + 1}:
                    </Label>

                    <div className="flex flex-col w-full gap-2">
                      <Label>Título</Label>
                      <div className="flex flex-col md:flex-row gap-2">
                        <Input
                          {...register(`assinatura.${index}.titulo`)}
                          className="w-full"
                          defaultValue={
                            index === 0
                              ? "INSTRUTOR"
                              : getValues(`assinatura.${index}.titulo`) || ""
                          }
                          onChange={(e) => {
                            if (index !== 0) {
                              setValue(
                                `assinatura.${index}.titulo`,
                                e.target.value
                              );
                            }
                          }}
                          readOnly={index === 0}
                        />
                        <Controller
                          name={`assinatura.${index}.assinante`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o assinante" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Assinante</SelectLabel>
                                  {instrutores.map((instrutor) => (
                                    <SelectItem
                                      key={instrutor.id} // Changed to use only instrutor.id for uniqueness
                                      value={String(instrutor.id)}
                                    >
                                      {instrutor.name} -{" "}
                                      {instrutor.qualificacaoProfissional} -{" "}
                                      {instrutor.registroProfissional}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Conteúdo aplicado */}
              <div className="w-full">
                <Label>Conteúdo Aplicado (opcional)</Label>
                <Textarea
                  {...register("conteudoAplicado")}
                  className="h-full w-full p-2 border rounded"
                />
              </div>
            </div>

            {/* Seleção de participantes */}
            <div className="mt-2">
              <Label>Participantes</Label>
              <Controller
                name="participantes"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={participantes.map((pessoa) => ({
                      label: pessoa.name,
                      cpf: pessoa.cpf,
                      matricula: pessoa.matricula,
                      empresa: pessoa?.empresa?.name,
                      value: pessoa.id,
                    }))}
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value || []}
                    placeholder="Selecione os participantes"
                    variant="default"
                    animation={2}
                  />
                )}
              />
            </div>

            {/* Separador */}
            {showIdentificationConfig && (
              <div className="w-full h-[2px] bg-gray-300 rounded-lg my-5" />
            )}

            {/* Seleção de instrutores por dia */}
            {formsOpen && showIdentificationConfig && (
              <div className="mt-4 flex flex-col">
                <p>Configurar Lista de Instrutores:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {days.map((day) => {
                    const parsed = day; // This is { date, start, end, intervalStart, intervalEnd }
                    const { start, end } = parsed;
                    const supports = {
                      morning: start < "12:00" && end > "06:00",
                      afternoon: start < "18:00" && end > "12:00",
                      night: start < "23:59" && end > "18:00",
                    };
                    return (
                      <div key={parsed.date} className="border p-4 rounded">
                        <div className="flex flex-col gap-2">
                          <Label>
                            Dia: {format(parseISO(parsed.date), "dd/MM/yyyy")}
                          </Label>
                          <Label>
                            Período: {start} ÀS {end}
                          </Label>
                        </div>
                        {selectedEvento && (
                          <div className="my-2 border-y py-4">
                            {Object.entries(supports).map(
                              ([period, ok]) =>
                                ok && (
                                  <div key={period} className="mb-2">
                                    <Label>
                                      Endereço{" "}
                                      {{
                                        morning: "Manhã",
                                        afternoon: "Tarde",
                                        night: "Noite",
                                      }[period as string] ||
                                        period.charAt(0).toUpperCase() +
                                          period.slice(1)}
                                    </Label>
                                    <Controller
                                      name={`courseDate.${
                                        parsed.date
                                      }.address.${period as SinglePeriod}`}
                                      control={control}
                                      render={({ field }) => (
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value || ""}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione o endereço" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectGroup>
                                              <SelectLabel>
                                                Endereços
                                              </SelectLabel>
                                              <SelectItem
                                                key={`${parsed.date}-address1-${period}`}
                                                value={
                                                  selectedEvento.courseLocation
                                                }
                                              >
                                                {selectedEvento.courseLocation}
                                              </SelectItem>
                                              {selectedEvento.courseLocation2 && (
                                                <SelectItem
                                                  key={`${parsed.date}-address2-${period}`}
                                                  value={
                                                    selectedEvento.courseLocation2
                                                  }
                                                >
                                                  {
                                                    selectedEvento.courseLocation2
                                                  }
                                                </SelectItem>
                                              )}
                                            </SelectGroup>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </div>
                                )
                            )}
                          </div>
                        )}

                        {["A", "B"].map((instrChar, instrIndex) => {
                          const instrKey =
                            instrChar === "A" ? "instrutorA" : "instrutorB";
                          const otherInstrKey =
                            instrChar === "A" ? "instrutorB" : "instrutorA";

                          const otherInstructorPeriodValue =
                            watchedCourseDate?.[parsed.date]?.[otherInstrKey]
                              ?.periodo || "nenhum";

                          const availablePeriods =
                            getAvailablePeriodsForInstructor(
                              otherInstructorPeriodValue, // Pass watched value
                              supports
                            );

                          return (
                            <div
                              key={`${parsed.date}-${instrKey}`}
                              className="flex flex-col gap-2 mt-2"
                            >
                              <div>
                                <Label>Instrutor {instrChar}</Label>
                                <Controller
                                  name={`courseDate.${parsed.date}.${instrKey}.instrutor`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value || ""}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="w-full mb-1">
                                        <SelectValue placeholder="Selecione Instrutor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel>Instrutores</SelectLabel>
                                          {instrutores.map((instrutor, idx) => (
                                            <SelectItem
                                              key={instrutor.id || idx}
                                              value={instrutor.name}
                                            >
                                              {instrutor.name}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                {errors?.courseDate?.[parsed.date]?.[instrKey]
                                  ?.instrutor && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {
                                      errors.courseDate[parsed.date]?.[instrKey]
                                        ?.instrutor?.message
                                    }
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label>Período Instrutor {instrChar}</Label>
                                <Controller
                                  name={`courseDate.${parsed.date}.${instrKey}.periodo`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value || "nenhum"}
                                      onValueChange={(newValue) => {
                                        const currentInstructorKey =
                                          instrIndex === 0
                                            ? "instrutorA"
                                            : "instrutorB";
                                        handlePeriodChangeForDay(
                                          parsed.date,
                                          currentInstructorKey,
                                          newValue as ValidPeriod,
                                          supports
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Período" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel>Períodos</SelectLabel>
                                          {availablePeriods.map((p) => (
                                            <SelectItem
                                              key={`${parsed.date}-${instrKey}-${p.value}`}
                                              value={p.value}
                                            >
                                              {p.label}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {errors?.courseDate?.[parsed.date]?.root && (
                          <p className="text-sm text-red-500 mt-2">
                            {errors.courseDate[parsed.date]?.root?.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Separador */}
            <div className="w-full h-[2px] bg-gray-300 rounded-lg my-5" />

            {/* Observações complementares */}
            <div className="flex flex-col gap-4">
              <div>
                <Label>Motivo do Treinamento</Label>
                <Textarea {...register("motivoTreinamento")} className="mb-4" />
              </div>
              <div>
                <Label>Objetivo da LF Soares Treinamentos e Serviços:</Label>
                <Textarea {...register("objetivoTreinamento")} />
              </div>
            </div>

            {/* Botão de submit */}
            <Button
              type="submit"
              className="bg-black text-white mt-5"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        ) : (
          /* Tabela de Identificadores Gerados */
          <CustomTable
            columns={[
              { key: "treinamento", label: "Treinamento" },
              { key: "code", label: "Código" },
              { key: "createdAt", label: "Data de Criação" },
            ]}
            data={filteredData.map((item, index) => ({
              ...item,
              id: item.id ?? `temp-${index}`, // Garante que id nunca será undefined
              createdAt: new Date(item.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))}
            onDownload={(_, row) => {
              try {
                // ✅ Parseando documentData antes de chamar gerarIdentificador
                const identificadorParsed = row.identificadorData
                  ? JSON.parse(row.identificadorData)
                  : null;

                if (!identificadorParsed) {
                  console.warn("Dados do identificador inválidos:", row);
                  return;
                }
                gerarIdentificador(
                  {
                    ...identificadorParsed,
                    id_code: String(row.code).padStart(3, "0"),
                  },
                  identificadorParsed.courseData,
                  identificadorParsed.numeroParticipantes
                );
              } catch (error) {
                console.error("Erro ao processar o identificador:", error);
              }
            }}
            loading={loading}
            entityLabel="Identificador"
            searchable
            hasNextPage={hasNextPage}
            page={page}
            onPageChange={handlePageChange}
            onDelete={handleUpdateStatus}
            onRestore={handleUpdateStatus}
          />
        )}
      </CardContent>
    </Card>
  );
};
