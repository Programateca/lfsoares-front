import { useEffect, useRef, useState } from "react";
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
import { gerarIdentificador, Period } from "@/utils/identificador";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";
import { IdentificadorData } from "@/@types/IdentificadorData";
import { useAuth } from "@/context/AuthContextProvider";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { formatarDatas } from "@/utils/formatar-datas";
import { processInstrutorDates } from "@/utils/process-instrutor-dates";

/**
 * Definição de tipos auxiliares
 */

interface ParticipanteMap {
  [key: string]: string;
}

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

export type CourseDate = {
  date: string;
  start: string;
  end: string;
  intervalStart: string;
  intervalEnd: string;
  instrutorA?: boolean;
  instrutorB?: boolean;
};

export const Identificadores = () => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      evento: "",
      certificadoTipo: "",
      conteudoAplicado: "",
      participantes: [],
      assinatura: [],
      motivoTreinamento: "",
      objetivoTreinamento: "",
      instrutorA: {},
      instrutorB: {},
      address: {},
      instrutoresPersonalizado: {},
    },
  });

  const [days, setDays] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [formsOpen, setFormsOpen] = useState(false);

  const [signatureCount, setSignatureCount] = useState(0);
  const [showIdentificationConfig, setShowIdentificationConfig] =
    useState(false);
  const [identificadoresGerados, setIdentificadoresGerados] = useState<
    IdentificadorData[]
  >([]); // TODO terminar de criar o type Identificador
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  // const [instrutoresSelecionados, setInstrutoresSelecionados] = useState({
  //   instrutorA: "Selecione o Instrutor",
  //   instrutorB: "Selecione o Instrutor",
  // });
  // const [hasAfternoon, setHasAfternoon] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) navigate("/login");

  const conteudo = watch("conteudoAplicado");
  const eventoSelecionado = watch("evento");
  const selectedEvento = eventos.find((ev) => ev.id === eventoSelecionado);

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const [showInativos, setShowInativos] = useState(false);

  /**
   * Busca dados iniciais do servidor
   */
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

  const prevEventoIdRef = useRef<string | undefined>();

  useEffect(() => {
    const currentValues = getValues();
    const currentEventoId = eventoSelecionado; // This is from watch("evento")

    if (!currentEventoId) {
      // Event is not selected or has been deselected
      reset({
        ...currentValues,
        evento: "",
        instrutorA: {},
        instrutorB: {},
        address: {},
        instrutoresPersonalizado: {},
        // Keep other non-event-specific fields from currentValues
      });
      prevEventoIdRef.current = undefined;
      return;
    }

    const selectedEventData = eventos.find((ev) => ev.id === currentEventoId);

    if (
      !selectedEventData ||
      !selectedEventData.courseDate ||
      selectedEventData.courseDate.length === 0
    ) {
      // Event selected, but data is incomplete (e.g., no dates)
      reset({
        ...currentValues,
        evento: currentEventoId, // Keep selected event
        instrutorA: {}, // Reset date-specific fields
        instrutorB: {},
        address: {},
        instrutoresPersonalizado: {},
      });
      prevEventoIdRef.current = currentEventoId;
      return;
    }

    const newDateKeys = selectedEventData.courseDate.map((dateStr) => {
      try {
        const parsedDate = JSON.parse(dateStr);
        return parsedDate.date;
      } catch {
        return dateStr.trim(); // Fallback if not JSON
      }
    });

    if (prevEventoIdRef.current !== currentEventoId) {
      // Event ID has actually changed, reset date-specific fields for the new event
      reset({
        ...currentValues,
        evento: currentEventoId,
        instrutorA: Object.fromEntries(
          newDateKeys.map((date) => [date, { periodo: undefined }])
        ),
        instrutorB: Object.fromEntries(
          newDateKeys.map((date) => [date, { periodo: undefined }])
        ),
        address: Object.fromEntries(
          newDateKeys.map((date) => [
            date,
            { morning: "", afternoon: "", night: "" },
          ])
        ),
        instrutoresPersonalizado: Object.fromEntries(
          newDateKeys.map((date) => [date, { A: "", B: "" }])
        ),
      });
    } else {
      // Event ID is the same, but `eventos` list might have changed.
      // Preserve existing instrutorA and instrutorB selections.
      // Re-key address and instrutoresPersonalizado to ensure they align with current newDateKeys,
      // using existing values from currentValues if available for those dates.
      const newAddress = Object.fromEntries(
        newDateKeys.map((date) => [
          date,
          currentValues.address?.[date] || {
            morning: "",
            afternoon: "",
            night: "",
          },
        ])
      );
      const newInstrutoresPersonalizado = Object.fromEntries(
        newDateKeys.map((date) => [
          date,
          currentValues.instrutoresPersonalizado?.[date] || { A: "", B: "" },
        ])
      );

      // Only update if necessary to avoid excessive re-renders / form state changes
      if (
        JSON.stringify(currentValues.address) !== JSON.stringify(newAddress)
      ) {
        setValue("address", newAddress);
      }
      if (
        JSON.stringify(currentValues.instrutoresPersonalizado) !==
        JSON.stringify(newInstrutoresPersonalizado)
      ) {
        setValue("instrutoresPersonalizado", newInstrutoresPersonalizado);
      }
      // If only `eventos` reference changed but `currentEventoId` and its dates are the same,
      // and `instrutorA`/`instrutorB` are already populated from user interaction,
      // this path aims to leave them untouched.
      // If `currentValues.evento` isn't `currentEventoId` (e.g. after a full reset), update it.
      if (currentValues.evento !== currentEventoId) {
        setValue("evento", currentEventoId);
      }
    }
    prevEventoIdRef.current = currentEventoId;
  }, [eventoSelecionado, eventos, reset, getValues, setValue]); // Added setValue to dependencies

  /**
   * Ajusta exibição de assinaturas com base no tipo selecionado
   */
  const handleSignatureCount = (value: string) => {
    setShowIdentificationConfig(value !== "2");
    setSignatureCount(Number(value));
  };

  /**
   * Ajusta os períodos de instrutores conforme a seleção.
   */
  const handlePeriodChange = (
    dayStr: string,
    instructor: "instrutorA" | "instrutorB",
    value: Period
  ) => {
    const parsed = JSON.parse(dayStr); // Keep parsed here
    const { start, end } = parsed; // Destructure only start and end
    const dateKey = parsed.date; // Use parsed.date directly for clarity

    const other = instructor === "instrutorA" ? "instrutorB" : "instrutorA";
    const canMorning = start < "12:00" && end > "05:00";
    const canAfternoon = end > "12:00" && start < "18:00";
    const canNight = end > "18:00" && start < "23:00";

    // Só manhã
    if (canMorning && !canAfternoon && !canNight) {
      setValue(`${instructor}.${dateKey}.periodo`, "manha");
      setValue(`${other}.${dateKey}.periodo`, "nenhum");
      return;
    }
    // Só tarde
    if (!canMorning && canAfternoon && !canNight) {
      setValue(`${instructor}.${dateKey}.periodo`, "tarde");
      setValue(`${other}.${dateKey}.periodo`, "nenhum");
      return;
    }

    // Só noite
    if (!canMorning && !canAfternoon && canNight) {
      setValue(`${instructor}.${dateKey}.periodo`, "noite");
      setValue(`${other}.${dateKey}.periodo`, "nenhum");
      return;
    }

    // Dia completo
    if (value === "manhaTarde" && canMorning && canAfternoon) {
      setValue(`${instructor}.${dateKey}.periodo`, "manhaTarde");
      setValue(`${other}.${dateKey}.periodo`, "nenhum");
      return;
    }

    if (value === "manhaNoite" && canMorning && canNight) {
      setValue(`${instructor}.${dateKey}.periodo`, "manhaNoite");
      setValue(`${other}.${dateKey}.periodo`, "nenhum");
      return;
    }

    if (value === "tardeNoite" && canAfternoon && canNight) {
      setValue(`${instructor}.${dateKey}.periodo`, "tardeNoite");
      setValue(`${other}.${dateKey}.periodo`, "nenhum");
      return;
    }

    setValue(`${instructor}.${dateKey}.periodo`, value);
    if (value === "nenhum") return;

    const otherValue = getValues(`${other}.${dateKey}.periodo`);
    if (otherValue === "nenhum") return;

    const complementary = getComplementaryPeriod(value);
    if (otherValue !== complementary && complementary !== null) {
      setValue(`${other}.${dateKey}.periodo`, complementary);
    }
  };
  function getComplementaryPeriod(value: Period): Period | null {
    switch (value) {
      case "manha":
        return "tarde";
      case "tarde":
        return "manha";
      case "noite":
        return null;
      case "manhaTarde":
      case "manhaNoite":
      case "tardeNoite":
        return "nenhum"; // combinado: outro instrutor não atua
      default:
        return null;
    }
  }
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const novoTexto = e.target.value;

    setValue("conteudoAplicado", novoTexto);
  };

  const handleEventoSelect = (eventoId: string) => {
    const evento = eventos.find((ev) => ev.id === eventoId);
    if (!evento) return;

    setDays(evento.courseDate);
  };

  const onSubmit = async (data: FormData) => {
    if (!data.participantes?.length) {
      toast.error("Selecione os participantes");
      return;
    }
    const selectedEvento = eventos.find((evento) => evento.id === data.evento);
    if (!selectedEvento) {
      toast.error("Evento selecionado não foi encontrado!");
      return;
    }

    // FOR DEBUGGING: Log critical data at submission
    console.log(
      "onSubmit - data.instrutorA:",
      JSON.stringify(data.instrutorA, null, 2)
    );
    console.log(
      "onSubmit - data.instrutorB:",
      JSON.stringify(data.instrutorB, null, 2)
    );
    console.log(
      "onSubmit - data.assinatura:",
      JSON.stringify(data.assinatura, null, 2)
    );

    const fullYear = new Date().getFullYear().toString();
    const certificadoCode = Number(
      (await api.get(`identificadores/last-certificado-code/${fullYear}`)).data
    );

    /**
     * Mapeando os participantes e preenchendo até o próximo múltiplo de 10
     */
    const participantesMap: ParticipanteMap = data.participantes.reduce(
      (acc, id, index) => {
        const participante = participantes.find((pessoa) => pessoa.id === id);
        const rowIndex = index + 1;

        acc[`p_nome${rowIndex}`] = participante?.name || "";
        acc[`p_matricula${rowIndex}`] = participante?.matricula
          ? participante?.matricula
          : participante?.cpf || "";
        acc[`p_manha${rowIndex}`] = "PRESENTE/APTO";
        acc[`p_tarde${rowIndex}`] = "PRESENTE/APTO";
        acc[`p_noite${rowIndex}`] = "PRESENTE/APTO";
        acc[`p_codigo${rowIndex}`] = participante
          ? `LFSTS ${String(certificadoCode + index).padStart(
              4,
              "0"
            )}/${fullYear}`
          : "";
        acc[`p_id${rowIndex}`] = participante ? participante.id : "";

        return acc;
      },
      {} as ParticipanteMap
    );

    // Ajuste para múltiplo de 10
    const totalParticipants = data.participantes.length;
    const nextMultipleOfTen = Math.ceil(totalParticipants / 10) * 10;
    const padding = nextMultipleOfTen - totalParticipants;

    for (let i = 1; i <= padding; i++) {
      const index = totalParticipants + i;
      participantesMap[`p_nome${index}`] = "";
      participantesMap[`p_matricula${index}`] = "";
      participantesMap[`p_codigo${index}`] = "";
      participantesMap[`p_id${index}`] = "";
      participantesMap[`p_manha${index}`] = "";
      participantesMap[`p_tarde${index}`] = "";
      participantesMap[`p_noite${index}`] = "";
    }

    /**
     * Obtemos as datas envolvidas de todos os dias instrutorA e instrutorB
     * e formatamos para exibição
     */
    const datasArray = selectedEvento.courseDate.map((dateStr) => {
      try {
        const parsed = JSON.parse(dateStr);
        return parsed.date;
      } catch (error) {
        // Se não conseguir fazer o parse, assume que a string já é a data
        return dateStr.trim();
      }
    });
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

    /**
     * Corpo de dados principal que será passado para gerarIdentificador()
     */
    if (!user) {
      return toast.error(
        "Parece que você não esta logado no sistema, por favor faça login novamente."
      );
    }

    const getAssinante = (index: number) => {
      const instrutor = instrutores.find(
        (item) =>
          data.assinatura[index]?.assinante &&
          item.id === data.assinatura[index].assinante
      );
      if (!instrutor) {
        return " ";
      }
      return `${instrutor.name} - ${instrutor.qualificacaoProfissional} - ${instrutor.registroProfissional}`;
    };

    const courseDateItens = selectedEvento?.courseDate.map((itemStr) =>
      JSON.parse(itemStr)
    ) as CourseDate[];

    const horariosSet = new Set<string>();
    const intervalosSet = new Set<string>();

    courseDateItens.forEach((item) => {
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

    // Construct instructorPeriodPreferences
    const instructorPeriodPreferences: Record<
      string,
      Record<string, Period | undefined>
    > = {};
    const eventDates = selectedEvento.courseDate.map((dateStr) => {
      try {
        const parsedDate = JSON.parse(dateStr);
        return parsedDate.date; // Assuming 'date' is the property with 'YYYY-MM-DD'
      } catch {
        return dateStr.trim(); // Fallback if not JSON or structure is different
      }
    });

    for (const date of eventDates) {
      instructorPeriodPreferences[date] = {}; // Initialize for the date

      if (data.assinatura && data.assinatura.length > 0) {
        const firstInstructorId = data.assinatura[0]?.assinante;
        if (firstInstructorId) {
          instructorPeriodPreferences[date][firstInstructorId] =
            data.instrutorA?.[date]?.periodo || undefined;
        }

        if (data.assinatura.length > 1) {
          const secondInstructorId = data.assinatura[1]?.assinante;
          if (secondInstructorId) {
            instructorPeriodPreferences[date][secondInstructorId] =
              data.instrutorB?.[date]?.periodo || undefined;
          }
        }

        // For any other instructors in data.assinatura (beyond the first two)
        // Ensure they have an entry in instructorPeriodPreferences for this date,
        // even if it's undefined, so processInstrutorDates knows they are part of the consideration.
        for (let i = 2; i < data.assinatura.length; i++) {
          const otherInstructorId = data.assinatura[i]?.assinante;
          if (otherInstructorId) {
            if (!(otherInstructorId in instructorPeriodPreferences[date])) {
              instructorPeriodPreferences[date][otherInstructorId] = undefined;
            }
          }
        }
      }
    }
    // FOR DEBUGGING: Log constructed instructorPeriodPreferences
    console.log(
      "onSubmit - constructed instructorPeriodPreferences:",
      JSON.stringify(instructorPeriodPreferences, null, 2)
    );

    // Create the data object for processInstrutorDates, conforming to UpdatedFormData
    // (omitting instrutorA, instrutorB from the top level, adding instructorPeriodPreferences)
    const { instrutorA, instrutorB, ...restOfData } = data; // instrutoresPersonalizado is already in restOfData
    const updatedFormDataForProcess = {
      ...restOfData,
      assinatura: data.assinatura || [], // Ensure assinatura is present
      instructorPeriodPreferences,
      // Ensure instrutoresPersonalizado is explicitly passed if it's not already in restOfData
      // or if its structure needs to be guaranteed.
      // Based on current FormData, it should be in restOfData.
      // If it were optional or handled differently, you might need:
      // instrutoresPersonalizado: data.instrutoresPersonalizado || {},
    };
    // FOR DEBUGGING: Log instructorPeriodPreferences being passed to processInstrutorDates
    console.log(
      "onSubmit - updatedFormDataForProcess.instructorPeriodPreferences:",
      JSON.stringify(
        updatedFormDataForProcess.instructorPeriodPreferences,
        null,
        2
      )
    );

    const dataGerador = {
      // Header
      header_revisao: "LUIS FERNANDO SOARES", // Nome de quem revisou
      header_data: "14/02/2025",
      revisao: "00",
      // Fim Header

      ...(() => {
        // Find the last filled assinatura
        if (!data?.assinatura || !Array.isArray(data.assinatura)) {
          return {
            titulo2: "",
            nome2: "",
            qualificacao_profissional2: "",
            registro_profissional2: "",
          };
        }

        let lastValidIndex = -1;
        for (let i = data.assinatura.length - 1; i >= 0; i--) {
          if (data.assinatura[i]?.assinante) {
            lastValidIndex = i;
            break;
          }
        }

        if (lastValidIndex === -1) {
          return {
            titulo2: "",
            nome2: "",
            qualificacao_profissional2: "",
            registro_profissional2: "",
          };
        }

        const assinatura = data.assinatura[lastValidIndex];
        const instrutor = instrutores.find(
          (item) => item.id === assinatura.assinante
        );

        return {
          titulo2: assinatura.titulo || "",
          nome2: instrutor ? instrutor.name + ":" : "",
          qualificacao_profissional2: instrutor?.qualificacaoProfissional || "",
          registro_profissional2: instrutor?.registroProfissional || "",
        };
      })(),

      is_short_course: selectedEvento?.treinamento?.courseHours, // Flag para indicar curso curto
      modulo: selectedEvento?.treinamento.courseMethodology,
      horarios: horarios,
      id_data: fullDateNow.replace(/\//g, "."), // Troca / por . para seguir o padrão apresentado pelo modelo deles
      responsavel_tecnico: "", // Deixa vazio pq não precisava desse campo e se tirar fica undefined XD

      // Mapeamento de participantes
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
      endereco: selectedEvento?.courseLocation2
        ? `${selectedEvento.courseLocation} | ${selectedEvento.courseLocation2}`
        : selectedEvento?.courseLocation || "",
      endereco2: selectedEvento?.courseLocation2
        ? selectedEvento?.courseLocation2
        : "",
      empresa: `${selectedEvento.empresa.name} - ${
        selectedEvento.empresa.cnpj ? selectedEvento.empresa.cnpj : ""
      }`,
      empresa_id: selectedEvento.empresa.id,
      datas: datasFormatadas.split(";")[0],
      tipo_certificado: data.certificadoTipo,

      // Assinaturas
      assinante_titulo1: data?.assinatura[0]?.titulo
        ? data.assinatura[0].titulo + ":"
        : "",
      assinante_titulo2: data?.assinatura[1]?.titulo
        ? data.assinatura[1].titulo + ":"
        : "",
      assinante_titulo3: data?.assinatura[2]?.titulo
        ? data.assinatura[2].titulo + ":"
        : "",
      assinante_titulo4: data?.assinatura[3]?.titulo
        ? data.assinatura[3].titulo + ":"
        : "",

      assinante1: getAssinante(0),
      assinante2: getAssinante(1),
      assinante3: getAssinante(2),
      assinante4: getAssinante(3),
      // instrutor_a: instrutoresSelecionados.instrutorA, // Removed
      // instrutor_b: instrutoresSelecionados.instrutorB, // Removed
      instrutorDates: processInstrutorDates({
        data: updatedFormDataForProcess, // Pass the updated data object
        courseDate: selectedEvento.courseDate,
        instrutores: instrutores, // This is the full list of Instrutor objects
      }),
    };

    // // FOR DEBUG
    console.log("dataGerador.instrutorDates", dataGerador.instrutorDates);
    gerarIdentificador(
      {
        ...(dataGerador as any),
        id_code: "teste",
      },
      dataGerador.instrutorDates,
      dataGerador.numeroParticipantes
    );
    return;

    // const saveResponse = await api.post("identificadores", newIdentificador);
    // if (saveResponse.status === 201) {
    //   toast.success("Identificador gerado com sucesso!");
    //   setIdentificadoresGerados((prev) => [
    //     ...prev,
    //     saveResponse.data as IdentificadorData,
    //   ]);
    //   setFormsOpen(false);
    // } else {
    //   toast.error("Erro ao gerar identificador!");
    // }
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
      if (status === 1)
        toast("Identificador ativado!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Identificador desativado!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchData();
    } catch (error) {}
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
                              // onValueChange={(value) => {
                              //   field.onChange(value);
                              //   if (index === 0) {
                              //     const selectedInstrutor =
                              //       instrutores.find((i) => i.id === value)
                              //         ?.name || "Selecione o Instrutor";
                              //     // setInstrutoresSelecionados((prev) => ({
                              //     //   ...prev,
                              //     //   instrutorA: selectedInstrutor,
                              //     // }));
                              //   } else if (index === 1) {
                              //     const selectedInstrutor =
                              //       instrutores.find((i) => i.id === value)
                              //         ?.name || "Selecione o Instrutor";
                              //     // setInstrutoresSelecionados((prev) => ({
                              //     //   ...prev,
                              //     //   instrutorB: selectedInstrutor,
                              //     // }));
                              //   }
                              // }}
                              // value={field.value}
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
                                      key={instrutor.id}
                                      value={instrutor.id}
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
                  value={conteudo || ""}
                  onChange={handleTextareaChange}
                  ref={textareaRef}
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
                  {days.map((day, idx) => {
                    const parsed = JSON.parse(day);
                    const { date, start, end } = parsed;
                    const supports = {
                      morning: start < "12:00" && end > "06:00",
                      afternoon: start < "18:00" && end > "12:00",
                      night: start < "23:59" && end > "18:00",
                    };
                    return (
                      <div key={idx} className="border p-4 rounded">
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
                                      {period.charAt(0).toUpperCase() +
                                        period.slice(1)}
                                    </Label>
                                    <Controller
                                      name={`address.${parsed.date}.${period}`}
                                      control={control}
                                      render={({ field }) => (
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value}
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
                                                value={
                                                  selectedEvento.courseLocation
                                                }
                                              >
                                                {selectedEvento.courseLocation}
                                              </SelectItem>
                                              {selectedEvento.courseLocation2 && (
                                                <SelectItem
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

                        {["A", "B"].map((key) => {
                          const instrKey =
                            key === "A" ? "instrutorA" : "instrutorB";
                          return (
                            <div
                              key={key}
                              className="flex gap-4 items-center mt-2"
                            >
                              <div className="w-full">
                                <Label>Instrutor {key}</Label>
                                <Controller
                                  name={`instrutoresPersonalizado.${parsed.date}.${key}`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      onValueChange={(v) => {
                                        field.onChange(v);
                                        // setInstrutoresSelecionados((prev) => ({
                                        //   ...prev,
                                        //   [instrKey]:
                                        //     instrutores.find((i) => i.id === v)
                                        //       ?.name || prev[instrKey],
                                        // }));
                                      }}
                                      value={field.value}
                                    >
                                      <SelectTrigger className="w-full mb-2">
                                        <SelectValue placeholder="Selecione Instrutor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel>Instrutores</SelectLabel>
                                          {instrutores.map((i) => (
                                            <SelectItem key={i.id} value={i.id}>
                                              {i.name}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                <Controller
                                  name={`${instrKey}.${parsed.date}.periodo`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      onValueChange={(v: Period) => {
                                        field.onChange(v);
                                        handlePeriodChange(
                                          day,
                                          instrKey as any,
                                          v
                                        );
                                      }}
                                      value={field.value}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Período" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel>Períodos</SelectLabel>
                                          <SelectItem value="nenhum">
                                            Nenhum
                                          </SelectItem>
                                          {supports.morning && (
                                            <SelectItem value="manha">
                                              Manhã
                                            </SelectItem>
                                          )}
                                          {supports.afternoon && (
                                            <SelectItem value="tarde">
                                              Tarde
                                            </SelectItem>
                                          )}
                                          {supports.night && (
                                            <SelectItem value="noite">
                                              Noite
                                            </SelectItem>
                                          )}
                                          {supports.morning &&
                                            supports.afternoon && (
                                              <SelectItem value="manhaTarde">
                                                Manhã e Tarde
                                              </SelectItem>
                                            )}
                                          {supports.morning &&
                                            supports.night && (
                                              <SelectItem value="manhaNoite">
                                                Manhã e Noite
                                              </SelectItem>
                                            )}
                                          {supports.afternoon &&
                                            supports.night && (
                                              <SelectItem value="tardeNoite">
                                                Tarde e Noite
                                              </SelectItem>
                                            )}
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })}
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
                  identificadorParsed.instrutorDates,
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
