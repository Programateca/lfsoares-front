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
import { gerarIdentificador } from "@/utils/identificador";
import toast from "react-hot-toast";
import CustomTable from "./CustomTable";
import { IdentificadorData } from "@/@types/IdentificadorData";
import { useAuth } from "@/context/AuthContextProvider";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { formatarDatas } from "@/utils/formatar-datas";
import { fillParticipants } from "@/utils/preencher-participantes-identificador";

/**
 * Definição de tipos auxiliares
 */

type FormData = {
  evento: string;
  certificadoTipo: string;
  conteudoAplicado: string;
  participantes: string[];
  assinatura: { titulo?: string; assinante?: string }[];
  motivoTreinamento?: string;
  objetivoTreinamento?: string;
  // address: Record<
  //   string,
  //   Partial<Record<"morning" | "afternoon" | "night", string>>
  // >;
  courseDate: Record<
    string,
    {
      address: { morning?: string; afternoon: string; night?: string };
      instrutorA: { instrutor?: string; periodo?: string };
      instrutorB: { instrutor?: string; periodo?: string };
    }
  >;
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
      courseDate: {},
    },
  });

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

  const [signatureCount, setSignatureCount] = useState(0);
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

  const handleEventoSelect = (eventoId: string) => {
    const evento = eventos.find((ev) => ev.id === eventoId);
    if (!evento) return;

    setDays(evento.courseDate.map((date) => JSON.parse(date)));
  };

  const onSubmit = async (data: FormData) => {
    console.log("FORM DATA:", data.courseDate);

    const transformedCourseData = Object.entries(data.courseDate).map(
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

    if (!data.participantes?.length) {
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
      courseDate: transformedCourseData,
      // instrutorDates: {},
    };

    // // FOR DEBUG
    console.log("dataGerador.instrutorDates", dataGerador.instrutorDates);
    gerarIdentificador(
      {
        ...(dataGerador as any),
        id_code: "teste",
      },
      dataGerador.courseDate,
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
                    const parsed = day;
                    const { start, end } = parsed;
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
                                      name={`courseDate.${parsed.date}.address.${period}`}
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
                                  name={`courseDate.${parsed.date}.${instrKey}.instrutor`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value || "erro"}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="w-full mb-2">
                                        <SelectValue placeholder="Selecione Instrutor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel>Instrutores</SelectLabel>
                                          {instrutores.map((i) => (
                                            <SelectItem
                                              key={i.id}
                                              value={i.name}
                                            >
                                              {i.name}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                <Controller
                                  name={`courseDate.${parsed.date}.${instrKey}.periodo`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
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
