import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ArrowLeft, BookUp2, CircleX, Edit, Loader2, Plus } from "lucide-react";
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
  EventSchedule,
  formatarDatas,
  gerarIdentificador,
  Period,
} from "@/utils/aux";

/**
 * Definição de tipos auxiliares
 */
type Dias = {
  instrutorA: Record<string, { periodo?: Period }>;
  instrutorB: Record<string, { periodo?: Period }>;
};

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

/**
 * Componente principal de Identificadores
 */
export const Identificadores = () => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<FormData>();

  // Estados
  const [days, setDays] = useState<string[]>([]);
  const [disabledFields, setDisabledFields] = useState<
    Record<string, { instrutorA: boolean; instrutorB: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [formsOpen, setFormsOpen] = useState(false);
  const [signatureCount, setSignatureCount] = useState(0);
  const [showIdentificationConfig, setShowIdentificationConfig] =
    useState(false);
  const [identificadoresGerados, setIdentificadoresGerados] = useState<any[]>(
    []
  );
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [instrutoresSelecionados, setInstrutoresSelecionados] = useState({
    instrutorA: "Selecione o Instrutor",
    instrutorB: "Selecione o Instrutor",
  });

  const conteudo = watch("conteudoAplicado");

  /**
   * Busca dados iniciais do servidor
   */
  const fetchData = async () => {
    try {
      // Poderíamos fazer as 4 requisições em paralelo (Promise.all),
      // mas somente se o backend suportar bem. Isso diminui o tempo total de loading.
      const [response, eventosResp, pessoasResp, instrutoresResp] =
        await Promise.all([
          api.get("documentos/identificadores"),
          api.get("eventos"),
          api.get("pessoas"),
          api.get("instrutores"),
        ]);

      setIdentificadoresGerados(response.data.data);
      setEventos(eventosResp.data.data);
      setParticipantes(pessoasResp.data.data);
      setInstrutores(instrutoresResp.data.data);
    } catch (error) {
      // Um console.error é mais indicado do que console.log em caso de erro
      console.error(error);
    }
  };

  /**
   * Carregando dados quando o componente é montado
   */
  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    inicializarFetch();
  }, []);

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
    setDisabledFields((prev) => {
      const newState = { ...prev };
      if (!newState[day]) {
        newState[day] = { instrutorA: false, instrutorB: false };
      }

      // Regras para o instrutor A
      if (instructor === "instrutorA") {
        if (value === "manha") {
          setValue(`instrutorB.${day}.periodo`, "tarde");
        } else if (value === "tarde") {
          setValue(`instrutorB.${day}.periodo`, "manha");
        } else if (value === "manhaTarde") {
          setValue(`instrutorB.${day}.periodo`, undefined);
        }
      }
      // Regras para o instrutor B
      if (instructor === "instrutorB") {
        if (value === "manha") {
          setValue(`instrutorA.${day}.periodo`, "tarde");
        } else if (value === "tarde") {
          setValue(`instrutorA.${day}.periodo`, "manha");
        } else if (value === "manhaTarde") {
          setValue(`instrutorA.${day}.periodo`, undefined);
        }
      }

      return newState;
    });
  };

  /**
   * Mantém numeração automática das linhas de texto.
   */
  const handleChangeConteudo = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const linhas = e.target.value.split("\n");
    const linhasNumeradas = linhas.map((linha, index) => {
      // Remove qualquer numeração existente
      const linhaSemNumero = linha.replace(/^\d+\.\s*/, "");
      return `${index + 1}. ${linhaSemNumero}`;
    });
    setValue("conteudoAplicado", linhasNumeradas.join("\n"));
  };

  /**
   * Gera lista de dias entre duas datas (início e fim) no formato "pt-BR".
   */
  const gerarDias = (inicio: string, fim: string): string[] => {
    const dias: string[] = [];
    const dataInicio = new Date(inicio.split("/").reverse().join("-"));
    const dataFim = new Date(fim.split("/").reverse().join("-"));

    const dataAtual = new Date(dataInicio);
    while (dataAtual <= dataFim) {
      dias.push(
        dataAtual.toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      );
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    return dias;
  };

  /**
   * Quando selecionamos o evento, atualizamos a lista de dias
   */
  const handleEventoSelect = (eventoId: string) => {
    const evento = eventos.find((ev) => ev.id === eventoId);
    if (!evento) return;

    const { courseDate, completionDate } = evento;
    const diasGerados = gerarDias(courseDate, completionDate);
    setDays(diasGerados);
  };

  /**
   * Retorna dados formatados de instrutorA e instrutorB
   */
  const formatDays = (dias: Dias): EventSchedule => ({
    instrutorA: Object.entries(dias.instrutorA).map(([dia, { periodo }]) => ({
      dia,
      periodo,
    })),
    instrutorB: Object.entries(dias.instrutorB).map(([dia, { periodo }]) => ({
      dia,
      periodo,
    })),
  });

  /**
   * Lógica de submit do formulário
   */
  const onSubmit = (data: FormData) => {
    // Caso não existam participantes selecionados
    if (!data.participantes?.length) {
      // Em produção, poderíamos usar toast ou outra UI de alerta mais amigável
      alert("Selecione os participantes");
      return;
    }

    const selectedEvento = eventos.find((evento) => evento.id === data.evento);
    if (!selectedEvento) {
      alert("Evento selecionado não foi encontrado!");
      return;
    }

    /**
     * Mapeando os participantes e preenchendo até o próximo múltiplo de 10
     */
    interface ParticipanteMap {
      [key: string]: string;
    }

    const participantesMap: ParticipanteMap = data.participantes.reduce(
      (acc, id, index) => {
        const participante = participantes.find((pessoa) => pessoa.id === id);
        const rowIndex = index + 1;

        acc[`p_nome${rowIndex}`] = participante?.name || "";
        acc[`p_matricula${rowIndex}`] = participante?.matricula || "";
        acc[`p_codigo${rowIndex}`] = participante ? "codigo-mudar" : "";

        return acc;
      },
      {}
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
    }

    /**
     * Obtemos as datas envolvidas de todos os dias instrutorA e instrutorB
     * e formatamos para exibição
     */
    const todasAsDatas = new Set([
      ...Object.keys(data.instrutorA),
      ...Object.keys(data.instrutorB),
    ]);
    const datasFormatadas = formatarDatas(Array.from(todasAsDatas));

    /**
     * Corpo de dados principal que será passado para gerarIdentificador()
     */
    const dataGerador = {
      mudar_modulo: "Teórico e Prático FIXO",
      mudar_horarios: "08:00 às 17:00 FIXO",
      id_code: "codigo-mudar",
      id_data: "data-mudar",
      responsavel_tecnico: "Nome do Responsável Técnico",

      // Mapeamento de participantes
      ...participantesMap,

      conteudo_aplicado: data.conteudoAplicado,
      motivo_treinamento:
        "Cumprir Norma Regulamentadora – NR33 - (Portaria SEPRT 1690, de 15/06/2022);\nCapacitar profissional na função de Supervisor de Espaço Confinado, ciente dos riscos, medidas de controle e procedimentos de trabalho;\nHabilitar profissional treinado e considerado apto, conforme requisitos técnicos e plano de ensino LF SOARES TREINAMENTOS E SERVIÇOS",
      objetivo_lf:
        "Fornecer informações atualizadas referente as normas e procedimentos, conscientizar empregado dos perigos e riscos, avaliar nível de conhecimento e comportamento mediante as atividades em sala de aula e exercícios práticos, habilitando aquele que pontuar média mínima de 8,0 e 100% de sua presença, conforme planejamento de ensino.",

      treinamento: selectedEvento.treinamento.name,
      treinamento_lista: selectedEvento.treinamento.name, // possivelmente igual
      contratante: selectedEvento.empresa.name,
      tipo: selectedEvento.treinamento.courseType,
      carga_horaria: selectedEvento.treinamento.courseHours,
      intervalo: selectedEvento.courseInterval,
      endereco: selectedEvento.courseLocation,
      empresa: selectedEvento.empresa.name,
      datas: datasFormatadas,

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

      assinante1:
        instrutores.find((item) => item.id === data.assinatura[0]?.assinante)
          ?.name || "",
      assinante2:
        instrutores.find((item) => item.id === data.assinatura[1]?.assinante)
          ?.name || "",
      assinante3:
        instrutores.find((item) => item.id === data.assinatura[2]?.assinante)
          ?.name || "",
      assinante4:
        instrutores.find((item) => item.id === data.assinatura[3]?.assinante)
          ?.name || "",

      // Exemplo fixo. Talvez queira buscar do backend.
      instrutor_a: "Nome Do Instrutor A",
      instrutor_b: "Nome Do Instrutor B",
    };

    /**
     * Formata data para instrutorA e instrutorB
     */
    const instrutorDates = formatDays({
      instrutorA: data.instrutorA,
      instrutorB: data.instrutorB,
    });

    /**
     * Chama a função geradora de identificadores
     */
    gerarIdentificador(dataGerador, instrutorDates, data.participantes.length);
  };

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
            onClick={() => setFormsOpen((prev) => !prev)}
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
                          {eventos.map((evento) => (
                            <SelectItem key={evento.id} value={evento.id}>
                              {evento.treinamento.name}
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
                          value={
                            // Define "Instrutor" em posições específicas
                            (index < 2 && signatureCount >= 3) ||
                            (index === 0 && signatureCount === 2)
                              ? "Instrutor"
                              : getValues(`assinatura.${index}.titulo`) || ""
                          }
                          onChange={(e) => {
                            // Permite edição somente para campos não fixos
                            if (
                              !(index < 2 && signatureCount >= 3) &&
                              !(index === 0 && signatureCount === 2)
                            ) {
                              setValue(
                                `assinatura.${index}.titulo`,
                                e.target.value
                              );
                            }
                          }}
                          readOnly={
                            (index < 2 && signatureCount >= 3) ||
                            (index === 0 && signatureCount === 2)
                          }
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
                <Label>Conteúdo Aplicado</Label>
                <Textarea
                  {...register("conteudoAplicado")}
                  value={conteudo || ""}
                  onChange={handleChangeConteudo}
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
                      value: pessoa.id,
                    }))}
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value || []}
                    placeholder="Selecione os participantes"
                    variant="inverted"
                    animation={2}
                    maxCount={3}
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
                      <Label>Dia: {day}</Label>

                      {/* Instrutor A */}
                      <div className="flex gap-4 items-center mt-2">
                        <div className="w-full">
                          <Label>{instrutoresSelecionados.instrutorA}</Label>
                          <Controller
                            name={`instrutorA.${day}.periodo`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value: Period) => {
                                  field.onChange(value);
                                  handlePeriodChange(day, "instrutorA", value);
                                }}
                                value={field.value}
                                disabled={
                                  disabledFields[day]?.instrutorA || false
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Período" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Períodos</SelectLabel>
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
                            name={`instrutorB.${day}.periodo`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value: Period) => {
                                  field.onChange(value);
                                  handlePeriodChange(day, "instrutorB", value);
                                }}
                                value={field.value}
                                disabled={
                                  disabledFields[day]?.instrutorB || false
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Período" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Períodos</SelectLabel>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-end">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="text-lg mr-2 animate-spin text-gray-500" />
                      <p>Carregando...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : identificadoresGerados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <CircleX className="h-6 w-6 text-red-400" />
                      <p className="text-sm text-red-400">
                        Os últimos certificados gerados aparecerão aqui.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                identificadoresGerados.map((identificador, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium py-2">
                      {identificador.nome || "Certificado"}
                    </TableCell>
                    <TableCell className="text-end py-2">
                      <Button
                        variant="outline"
                        className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      >
                        <BookUp2 className="mr-2 h-4 w-4" />
                        Baixar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
