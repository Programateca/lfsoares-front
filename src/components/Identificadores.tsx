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
import {
  formatarDatas,
  formatDays,
  gerarIdentificador,
  Period,
} from "@/utils/identificador";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";
import { IdentificadorData } from "@/@types/IdentificadorData";
import { useAuth } from "@/context/AuthContextProvider";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
// import { ModelType } from "@/@types/ModeType";
// import { getLastDocumentCode } from "@/utils/get-last-document-code";

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
};

// TODO Terminar o type do Identificador

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
  } = useForm<FormData>();

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
  const [instrutoresSelecionados, setInstrutoresSelecionados] = useState({
    instrutorA: "Selecione o Instrutor",
    instrutorB: "Selecione o Instrutor",
  });
  const [hasAfternoon, setHasAfternoon] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) navigate("/login");

  const conteudo = watch("conteudoAplicado");

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
      setParticipantes(pessoasResp.data.data);
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
    day: string,
    instructor: "instrutorA" | "instrutorB",
    value: Period
  ) => {
    // Converte a string day em objeto para extrair os valores
    const dayObj = JSON.parse(day);
    const {
      courseStart,
      courseEnd,
      courseIntervalStart, // ex: "12:00"
      courseIntervalEnd, // ex: "13:00"
    } = dayObj;

    // Determina se o dia é de meio período
    // Exemplo: se courseIntervalStart for igual a courseEnd, o dia é somente de manhã
    //          se courseIntervalEnd for igual a courseStart, o dia é somente à tarde
    const isHalfDayMorning = courseIntervalStart === courseEnd;
    const isHalfDayAfternoon = courseIntervalEnd === courseStart;
    const isHalfDay = isHalfDayMorning || isHalfDayAfternoon;
    const allowed = isHalfDayMorning
      ? "manha"
      : isHalfDayAfternoon
      ? "tarde"
      : null;

    // Identifica o outro instrutor
    const otherInstructor =
      instructor === "instrutorA" ? "instrutorB" : "instrutorA";

    if (isHalfDay) {
      // Em dias de meio período, somente o valor permitido é aceito
      if (value !== allowed) {
        setValue(`${instructor}.${day}.periodo`, allowed || "nenhum");
        setValue(`${otherInstructor}.${day}.periodo`, "nenhum");
        return;
      } else {
        setValue(`${instructor}.${day}.periodo`, allowed);
        setValue(`${otherInstructor}.${day}.periodo`, "nenhum");
        return;
      }
    }

    // Se o evento não tem aula à tarde (ou seja, apenas manhã), força "manha" para ambos
    if (!hasAfternoon) {
      setValue(`${instructor}.${day}.periodo`, "manha");
      setValue(
        instructor === "instrutorA"
          ? `instrutorB.${day}.periodo`
          : `instrutorA.${day}.periodo`,
        "manha"
      );
      return;
    }

    // Se for selecionado "manhaTarde" para um instrutor, o outro fica "nenhum"
    if (value === "manhaTarde") {
      setValue(`${instructor}.${day}.periodo`, "manhaTarde");
      setValue(`${otherInstructor}.${day}.periodo`, "nenhum");
      return;
    }

    // Para valores "manha", "tarde" ou "nenhum" em dias com período completo:
    setValue(`${instructor}.${day}.periodo`, value);
    const complementaryValue = value === "manha" ? "tarde" : "manha";
    const currentOtherValue = getValues(`${otherInstructor}.${day}.periodo`);

    // Se o valor selecionado for "nenhum" ou se o outro já estiver "nenhum", não altera
    if (value === "nenhum" || currentOtherValue === "nenhum") {
      return;
    }

    // Caso o valor do outro instrutor não seja o complementar, atualiza automaticamente
    if (currentOtherValue !== complementaryValue) {
      setValue(`${otherInstructor}.${day}.periodo`, complementaryValue);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const novoTexto = e.target.value;

    setValue("conteudoAplicado", novoTexto);
  };

  const handleEventoSelect = (eventoId: string) => {
    const evento = eventos.find((ev) => ev.id === eventoId);
    if (!evento) return;

    setDays(evento.courseDate);

    if (evento.courseTime && evento.courseInterval) {
      const [, fim] = evento.courseTime.split(" ÀS ");
      const [intervaloInicio] = evento.courseInterval.split(" ÀS ");
      // Se o horário de término não coincide com o início do intervalo,
      // significa que há aula à tarde.
      setHasAfternoon(fim !== intervaloInicio);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!data.participantes?.length) {
      // TODO Em produção, poderíamos usar toast ou outra UI de alerta mais amigável
      toast.error("Selecione os participantes");
      return;
    }
    const selectedEvento = eventos.find((evento) => evento.id === data.evento);
    if (!selectedEvento) {
      toast.error("Evento selecionado não foi encontrado!");
      return;
    }

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
    }

    /**
     * Obtemos as datas envolvidas de todos os dias instrutorA e instrutorB
     * e formatamos para exibição
     */
    const datasArray = selectedEvento.courseDate.map((dateStr) => {
      try {
        const parsed = JSON.parse(dateStr);
        return parsed.day;
      } catch (error) {
        // Se não conseguir fazer o parse, assume que a string já é a data
        return dateStr.trim();
      }
    });

    const datasFormatadas = formatarDatas(datasArray);
    /**
     * Formata as datas para manha e tarde
     */
    const horas_aulas = selectedEvento?.courseTime;
    const intervalo = selectedEvento?.courseInterval;
    let manha_horario = "";
    let tarde_horario = "";
    if (horas_aulas && intervalo) {
      const [inicio, fim] = horas_aulas.split(" ÀS ");
      const [intervaloInicio, intervaloFim] = intervalo.split(" ÀS ");

      // Se o final das aulas for igual ao início do intervalo,
      // significa que não há aula à tarde.
      if (fim === intervaloInicio) {
        manha_horario = `${inicio} ÀS ${fim}`;
        tarde_horario = ""; // ou alguma outra lógica se necessário
        setHasAfternoon(false);
      } else {
        manha_horario = `${inicio} ÀS ${intervaloInicio}`;
        tarde_horario = `${intervaloFim} ÀS ${fim}`;
        setHasAfternoon(true);
      }
    }

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

    const dataGerador = {
      // Header
      header_revisao: "LUIS FERNANDO SOARES", // Nome de quem revisou
      header_data: "14/02/2025",
      revisao: "00",

      titulo2: data?.assinatura[1]?.titulo ? data.assinatura[1].titulo : "",
      nome2: data?.assinatura[1]?.assinante
        ? instrutores.find((item) => item.id === data.assinatura[1]?.assinante)
            ?.name + ":"
        : "",
      qualificacao_profissional2: instrutores.find(
        (item) => item.id === data.assinatura[1]?.assinante
      )?.qualificacaoProfissional,
      registro_profissional2: instrutores.find(
        (item) => item.id === data.assinatura[1]?.assinante
      )?.registroProfissional,

      manha_horario,
      tarde_horario,
      mudar_modulo: selectedEvento?.treinamento.courseMethodology, // TODO Acho que ta certo
      mudar_horarios: selectedEvento?.courseTime,
      id_data: fullDateNow.replace(/\//g, "."), // Troca / por . para seguir o padrão apresentado pelo modelo deles
      responsavel_tecnico: "", // Deixa vazio pq não precisava desse campo e se tirar fica undefined XD

      // Mapeamento de participantes
      ...participantesMap,
      numeroParticipantes: totalParticipants,

      conteudo_aplicado: conteudoAplicado,
      motivo_treinamento: data.motivoTreinamento,
      objetivo_lf: data.objetivoTreinamento,
      treinamento:
        selectedEvento.treinamento.name.length > 70
          ? `${selectedEvento.treinamento.name.substring(0, 67)}...`
          : selectedEvento.treinamento.name,
      treinamento_lista:
        selectedEvento.treinamento.name.length > 70
          ? `${selectedEvento.treinamento.name.substring(0, 67)}...`
          : selectedEvento.treinamento.name, // TODO Checar: possivelmente igual a treinamento
      evento_id: selectedEvento.id,
      contratante: selectedEvento.empresa.name,
      tipo: selectedEvento.treinamento.courseType,
      carga_horaria: `${selectedEvento.treinamento.courseHours} HORAS/AULA`,
      intervalo: selectedEvento.courseInterval,
      endereco: selectedEvento.courseLocation,
      empresa: selectedEvento.empresa.name,
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

      assinante1: instrutores.find(
        (item) => item.id === data.assinatura[0]?.assinante
      )
        ? `${
            instrutores.find(
              (item) => item.id === data.assinatura[0]?.assinante
            )?.name
          } - ${
            instrutores.find(
              (item) => item.id === data.assinatura[0]?.assinante
            )?.registroProfissional
          }`
        : "",
      assinante2: instrutores.find(
        (item) => item.id === data.assinatura[1]?.assinante
      )
        ? `${
            instrutores.find(
              (item) => item.id === data.assinatura[1]?.assinante
            )?.name
          } - ${
            instrutores.find(
              (item) => item.id === data.assinatura[1]?.assinante
            )?.registroProfissional
          }`
        : "",
      assinante3: instrutores.find(
        (item) => item.id === data.assinatura[2]?.assinante
      )
        ? `${
            instrutores.find(
              (item) => item.id === data.assinatura[2]?.assinante
            )?.name
          } - ${
            instrutores.find(
              (item) => item.id === data.assinatura[2]?.assinante
            )?.registroProfissional
          }`
        : "",
      assinante4: instrutores.find(
        (item) => item.id === data.assinatura[3]?.assinante
      )
        ? `${
            instrutores.find(
              (item) => item.id === data.assinatura[3]?.assinante
            )?.name
          } - ${
            instrutores.find(
              (item) => item.id === data.assinatura[3]?.assinante
            )?.registroProfissional
          }`
        : "",

      instrutor_a: instrutoresSelecionados.instrutorA,
      instrutor_b: instrutoresSelecionados.instrutorB,
      /**
       * Formata data para instrutorA e instrutorB
       */
      instrutorDates: formatDays({
        instrutorA:
          signatureCount !== 2
            ? days.reduce((acc, day) => {
                console.log(JSON.parse(day).day);
                console.log(data.instrutorA);
                console.log(data.instrutorB);
                acc[JSON.parse(day).day] = {
                  periodo:
                    data.instrutorA?.[JSON.parse(day).day]?.periodo ||
                    ("manhaTarde" as Period),
                };
                return acc;
              }, {} as Record<string, { periodo?: Period }>)
            : Object.fromEntries(
                days.map((day) => [
                  JSON.parse(day).day,
                  { periodo: "manhaTarde" as Period },
                ])
              ),
        instrutorB:
          signatureCount === 2
            ? null
            : days.reduce((acc, day) => {
                acc[JSON.parse(day).day] = {
                  periodo:
                    data.instrutorB?.[JSON.parse(day).day]?.periodo ||
                    ("manhaTarde" as Period),
                };
                return acc;
              }, {} as Record<string, { periodo?: Period }>),
      }),
    };
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
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (index === 0) {
                                  const selectedInstrutor =
                                    instrutores.find((i) => i.id === value)
                                      ?.name || "Selecione o Instrutor";
                                  setInstrutoresSelecionados((prev) => ({
                                    ...prev,
                                    instrutorA: selectedInstrutor,
                                  }));
                                } else if (index === 1) {
                                  const selectedInstrutor =
                                    instrutores.find((i) => i.id === value)
                                      ?.name || "Selecione o Instrutor";
                                  setInstrutoresSelecionados((prev) => ({
                                    ...prev,
                                    instrutorB: selectedInstrutor,
                                  }));
                                }
                              }}
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
                                      {instrutor.name}
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
            {showIdentificationConfig && (
              <div className="mt-4 flex flex-col">
                <p className="my-1 w-full">Configurar Lista de Instrutores:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                  {days.map((day, index) => (
                    <div key={index} className="border p-4 w-full rounded">
                      <div className="flex flex-col gap-2">
                        <Label>
                          Dia:{" "}
                          {format(parseISO(JSON.parse(day).day), "dd/MM/yyyy")}
                        </Label>
                        <Label>
                          Periodo: {JSON.parse(day).courseStart} ÀS{" "}
                          {JSON.parse(day).courseEnd}{" "}
                        </Label>
                      </div>
                      {/* Instrutor A */}
                      <div className="flex gap-4 items-center mt-2">
                        <div className="w-full">
                          <Label>{instrutoresSelecionados.instrutorA}</Label>
                          <Controller
                            name={`instrutorA.${JSON.parse(day).day}.periodo`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value: Period) => {
                                  field.onChange(value);
                                  handlePeriodChange(day, "instrutorA", value);
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
                                    <SelectItem value="manha">Manhã</SelectItem>
                                    <SelectItem value="tarde">Tarde</SelectItem>
                                    <SelectItem value="manhaTarde">
                                      Manhã e Tarde
                                    </SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      {/* Instrutor B */}
                      <div className="flex gap-4 items-center mt-2">
                        <div className="w-full">
                          <Label>{instrutoresSelecionados.instrutorB}</Label>
                          <Controller
                            name={`instrutorB.${JSON.parse(day).day}.periodo`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value: Period) => {
                                  field.onChange(value);
                                  handlePeriodChange(day, "instrutorB", value);
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
                                    <SelectItem value="manha">Manhã</SelectItem>
                                    <SelectItem value="tarde">Tarde</SelectItem>
                                    <SelectItem value="manhaTarde">
                                      Manhã e Tarde
                                    </SelectItem>
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
                  identificadorParsed.numeroParticipantes,

                  "hora do curso - FIXO"
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
