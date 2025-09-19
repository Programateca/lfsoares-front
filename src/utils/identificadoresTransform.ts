import { CourseData } from "@/@types/Identificador";
import { Evento } from "@/@types/Evento";
import { Instrutor } from "@/@types/Instrutor";
import { Pessoa } from "@/@types/Pessoa";
import { formatarDatas } from "@/utils/formatar-datas";
import { fillParticipants } from "@/utils/preencher-participantes-identificador";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

type FormData = {
  evento: string;
  certificadoTipo: string;
  conteudoAplicado?: string;
  participantes: string[];
  assinatura: Array<{ titulo?: string; assinante?: string }>;
  motivoTreinamento?: string;
  objetivoTreinamento?: string;
  assinaturaImagem?: string;
  courseDate?: Record<string, any>;
};

export const transformCourseData = (
  data: FormData,
  days: any[],
  signatureCount: number,
  selectedEvento: Evento,
  instrutores: Instrutor[]
): CourseData[] | null => {
  if (signatureCount > 2) {
    if (!data.courseDate) {
      toast.error("Erro inesperado.");
      return null;
    }
    return Object.entries(data.courseDate).map(([date, details]) => {
      const dayInfo = days.find((d) => d.date === date);
      if (dayInfo) {
        return {
          ...details,
          date: { ...dayInfo },
        };
      }
      throw new Error("Erro com a data do evento");
    });
  } else {
    return days.map((day) => {
      const dayStartTime = day.start;
      const dayEndTime = day.end;

      const isMorning = dayStartTime < "12:00" && dayEndTime > "06:00";
      const isAfternoon = dayStartTime < "18:00" && dayEndTime > "12:00";
      const isNight = dayStartTime < "23:59" && dayEndTime > "18:00";

      let instructorAPeriod: string | undefined = undefined;
      if (isMorning && isAfternoon && isNight) {
        instructorAPeriod = undefined;
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
        if (isMorning) courseDayAddress.morning = selectedEvento.courseLocation;
        if (isAfternoon)
          courseDayAddress.afternoon = selectedEvento.courseLocation;
        if (isNight) courseDayAddress.night = selectedEvento.courseLocation;
      }

      return {
        address: courseDayAddress,
        date: { ...day },
        instrutorA: {
          instrutor: getAssinante(0, false, data.assinatura, instrutores),
          periodo: instructorAPeriod,
        },
        instrutorB: {},
      };
    });
  }
};

export const validateCourseData = (
  transformedCourseData: CourseData[]
): boolean => {
  return transformedCourseData.every((courseDate) => {
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
};

export const prepareDataGerador = async (
  data: FormData,
  selectedEvento: Evento,
  instrutores: Instrutor[],
  participantes: Pessoa[],
  transformedCourseData: CourseData[]
) => {
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
    header_revisao: "LUIS FERNANDO SOARES",
    header_data: "14/02/2025",
    revisao: "00",
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
    })(),
    is_short_course: selectedEvento?.treinamento?.courseHours,
    modulo: selectedEvento?.treinamento.courseMethodology,
    horarios: horarios,
    id_data: fullDateNow.replace(/\//g, "."),
    responsavel_tecnico: "",
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
    empresa: `${selectedEvento.empresa.name.trim()}`,
    empresa_id: selectedEvento.empresa.id,
    datas: datasFormatadas.split(";")[0],
    tipo_certificado: data.certificadoTipo,
    assinante_titulo1: data?.assinatura[0]?.titulo || "",
    assinante_titulo2: data?.assinatura[1]?.titulo || "",
    assinante_titulo3: data?.assinatura[2]?.titulo || "",
    assinante_titulo4: data?.assinatura[3]?.titulo || "",
    assinante1: getAssinante(0, true, data.assinatura, instrutores),
    assinante2: getAssinante(1, true, data.assinatura, instrutores),
    assinante3: getAssinante(2, true, data.assinatura, instrutores),
    assinante4: getAssinante(3, true, data.assinatura, instrutores),
    courseData: transformedCourseData,
    assinatura: data.assinaturaImagem || null,
  };

  return { dataGerador, certificadoCode, fullYear };
};

const getAssinante = (
  index: number,
  full: boolean,
  assinatura: Array<{ titulo?: string; assinante?: string }>,
  instrutores: Instrutor[]
) => {
  const instrutor = instrutores.find(
    (item) =>
      assinatura[index]?.assinante && item.id === assinatura[index].assinante
  );
  if (!instrutor) {
    return " ";
  }
  if (!full) return instrutor.name.trim();
  return `${instrutor.name} - ${instrutor.qualificacaoProfissional} - ${instrutor.registroProfissional}`;
};
