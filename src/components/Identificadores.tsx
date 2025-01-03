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
import { MultiSelect } from "@/components/multi-select";
import { Pessoa } from "@/@types/Pessoa";
import { Instrutor } from "@/@types/Instrutor";

export const Identificadores = () => {
  const { control, register, handleSubmit, watch, setValue } = useForm();
  const [days, setDays] = useState<string[]>([]);
  const [disabledFields, setDisabledFields] = useState<
    Record<string, { instrutorA: boolean; instrutorB: boolean }>
  >({});

  const [loading, setLoading] = useState(true);
  const [formsOpen, setFormsOpen] = useState(false);
  const [signatureCount, setSignatureCount] = useState(0);
  const [showIdentificationConfig, setShowIdentificationConfig] =
    useState(false);

  const conteudo = watch("conteudoAplicado");

  const [identificadoresGerados, setIdentificadoresGerados] = useState([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);

  const fetchData = async () => {
    try {
      const response = await api.get("documentos/identificadores");
      const eventosResp = await api.get("eventos");
      const pessoasResp = await api.get("pessoas");
      const instrutoresResp = await api.get("instrutores");
      console.log(response);
      setParticipantes(pessoasResp.data.data);
      setIdentificadoresGerados(response.data.data);
      setInstrutores(instrutoresResp.data.data);
      setEventos(eventosResp.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const handleSignatureCount = (value: string) => {
    setShowIdentificationConfig(value !== "2");

    setSignatureCount(Number(value));
  };

  const handlePeriodChange = (
    day: string | number,
    instructor: string,
    value: string
  ) => {
    setDisabledFields((prev) => {
      const newState = { ...prev };
      if (!newState[day])
        newState[day] = { instrutorA: false, instrutorB: false };

      if (value === "manhaTarde") {
        if (instructor === "instrutorA") newState[day].instrutorB = true;
        if (instructor === "instrutorB") newState[day].instrutorA = true;
      } else {
        if (instructor === "instrutorA") newState[day].instrutorB = false;
        if (instructor === "instrutorB") newState[day].instrutorA = false;
      }

      return newState;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const linhas = e.target.value.split("\n");
    const linhasNumeradas = linhas.map((linha, index) => {
      const linhaSemNumero = linha.replace(/^\d+\.\s*/, "");
      return `${index + 1}. ${linhaSemNumero}`;
    });
    setValue("conteudoAplicado", linhasNumeradas.join("\n"));
  };

  const handleEventoSelect = (value: string) => {
    const evento = eventos.find((evento) => evento.id === value);
    if (!evento) return;

    const { courseDate, completionDate } = evento;

    const gerarDias = (inicio: string, fim: string): string[] => {
      const dias: string[] = [];
      const dataInicio = new Date(inicio.split("/").reverse().join("-")); // "20/12/2024" -> "2024-12-20"
      const dataFim = new Date(fim.split("/").reverse().join("-")); // "22/12/2024" -> "2024-12-22"

      let dataAtual = new Date(dataInicio);
      while (dataAtual <= dataFim) {
        dias.push(
          dataAtual.toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        );
        dataAtual.setDate(dataAtual.getDate() + 1); // Incrementa 1 dia
      }
      return dias;
    };

    const diasGerados = gerarDias(courseDate, completionDate);
    setDays(diasGerados);
    console.log(diasGerados); // Para verificar os dias gerados
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">
          Lista de Identificadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Button
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
            onClick={() => setFormsOpen(!formsOpen)}
          >
            {formsOpen ? (
              <>
                <ArrowLeft className=" h-4 w-4" />
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
        {formsOpen ? (
          <form
            onSubmit={handleSubmit((data) => {
              console.log(data);
            })}
          >
            <div className="flex gap-4 w-full">
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
            <div className="my-4 flex flex-row gap-4">
              <div className="w-full">
                {Array.from({ length: signatureCount }).map((_, index) => (
                  <div
                    key={index}
                    className="flex justify-start items-end gap-5 mb-3"
                  >
                    <Label className="pb-4 text-nowrap">
                      Assinatura {index + 1}:
                    </Label>
                    <div className="flex flex-col w-full gap-2 ">
                      <Label>Título</Label>
                      <div className="flex gap-2">
                        <Input
                          {...register(`assinatura[${index}].titulo`)}
                          className="w-full"
                        />
                        <Controller
                          name={`assinatura[${index}].assinante`}
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
                                      value={instrutor.id}
                                      key={instrutor.id}
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
              <div className="w-full">
                <Label>Conteúdo Aplicado</Label>
                <Textarea
                  {...register("conteudoAplicado")}
                  value={conteudo}
                  onChange={handleChange}
                  className="h-full w-full p-2 border rounded"
                />
              </div>
            </div>

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
                  placeholder="Select frameworks"
                  variant="inverted"
                  animation={2}
                  maxCount={3}
                />
              )}
            />
            {showIdentificationConfig && (
              <div className="w-full h-[2px] bg-gray-300  rounded-lg  my-5">
                <span className=""></span>
              </div>
            )}

            {showIdentificationConfig && (
              <div className="mt-4 flex gap-4 flex-col">
                <p className="my-1 w-full">Configurar Lista:</p>
                <div className="grid grid-cols-5 gap-4">
                  {days.map((day, index) => (
                    <div key={index} className="border p-4 mb-4 w-full">
                      <Label>Dia: {day}</Label>
                      <div className="flex gap-4 items-center">
                        <div>
                          <Label>Instrutor A</Label>
                          <Controller
                            name={`instrutorA.${day}.periodo`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handlePeriodChange(day, "instrutorA", value);
                                }}
                                value={field.value}
                                disabled={
                                  disabledFields[day]?.instrutorA || false
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione o período" />
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
                      <div className="flex gap-4 items-center mt-2">
                        <div>
                          <Label>Instrutor B</Label>
                          <Controller
                            name={`instrutorB.${day}.periodo`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handlePeriodChange(day, "instrutorB", value);
                                }}
                                value={field.value}
                                disabled={
                                  disabledFields[day]?.instrutorB || false
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione o período" />
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

            <div className="w-full h-[2px] bg-gray-300  rounded-lg  my-5">
              <span className=""></span>
            </div>

            <Label>Motivo do Treinamento</Label>
            <Textarea {...register("motivoTreinamento")} className="mb-4" />
            <Label>Objetivo da LF Soares Treinamentos e Serviços:</Label>
            <Textarea {...register("objetivoTreinamento")} />

            <Button type="submit" className="bg-black text-white mt-5">
              Salvar
            </Button>
          </form>
        ) : (
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
                      <div className="loader"></div>
                      <Loader2 className="text-lg mr-2 animate-spin text-gray-500" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : identificadoresGerados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <CircleX className="h-6 w-6 text-red-400" />
                      <p className="text-sm text-red-400">
                        Os ultimos certificados gerados aparecerão aqui.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                identificadoresGerados.map(() => (
                  <TableRow>
                    <TableCell className="font-medium py-2">
                      Certificado
                    </TableCell>
                    <TableCell className="text-end py-2">
                      <Button
                        variant={"outline"}
                        className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      >
                        <Edit />
                        Editar
                      </Button>
                      <Button
                        variant={"outline"}
                        className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      >
                        <BookUp2 />
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
