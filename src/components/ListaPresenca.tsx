import { useForm } from "react-hook-form";
import { Button } from "./ui/button";

import { api } from "@/lib/axios";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { BookUp2, CircleX, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Evento } from "@/@types/Evento";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Pessoa } from "@/@types/Pessoa";
import { Label } from "./ui/label";
import { gerarLista } from "@/utils/gerar-lista";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import toast from "react-hot-toast";
import { DocxElementRemover } from "@/utils/docx-element-remover";
import { Models } from "@/@types/Models";

interface ListaDiaTodo {
  tipo_lista: string;
  evento: string;
  nome_treinamento: string;
  tipo: string; // FORMAÇÃO OU ATUALIZAÇÃO PERIODICA
  intervalo: string; // XX:XX ÀS XX:XX
  cidade: string; // TRÊS LAGOAS / MS
  nome_instrutor: string;
  horario: string; // XX:XX ÀS XX:XX
  modulo: string; // TEÓRICO OU PRÁTICO / OU TEORICO E PRÁTICO
  carga_horaria: string; // 08 HORAS AULA
  datas: string; // XX/XX/XXXX À XX/XX/XXXX
  endereco: string; // RUA PEDRO PIERRE, N° 3150, JARDIM MOÇAMBIQUE
  nome_empresa: string;
  cnpj: string; // XX.XXX.XXX/XX-XX
  participante_1: string;
  participante_2: string;
  participante_3: string;
  participante_4: string;
  participante_5: string;
  participante_6: string;
  participante_7: string;
  participante_8: string;
  participante_9: string;
  participante_10: string;
}

const ListaPresenca = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);

  const form = useForm<ListaDiaTodo>();

  const onSubmit = async (data: ListaDiaTodo) => {
    const eventoFiltrado = eventos.find((evento) => evento.id === data.evento);

    if (!data.tipo_lista) {
      toast.error("Selecione o tipo de lista");
      return;
    }

    if (!eventoFiltrado) {
      toast.error("Evento não encontrado");
      return;
    }
    if (!data.modulo) {
      toast.error("Informe o módulo");
      return;
    }
    if (!data.cidade) {
      toast.error("Informe a cidade");
      return;
    }

    if (participantes.length === 0) {
      toast.error("Selecione ao menos um participante");
      return;
    }

    const schema: { [key: string]: string } = {
      cidade: data.cidade,
      nome_empresa: eventoFiltrado?.empresa.name,
      nome_treinamento: eventoFiltrado?.treinamento.name,
      nome_instrutor: eventoFiltrado?.instrutor.name,
      tipo: eventoFiltrado?.treinamento.courseType,
      horario: eventoFiltrado?.courseTime,
      modulo: data.modulo,
      carga_horaria: eventoFiltrado?.treinamento.courseHours,
      datas: eventoFiltrado?.courseDate,
      endereco: eventoFiltrado?.courseLocation,
      intervalo: data.intervalo || "N/A",
      cnpj: eventoFiltrado?.empresa.cnpj,
    };

    for (let i = 1; i < 60; i++) {
      schema[`participante_${i + 1}`] = " ";
    }

    participantes.forEach((participante, index) => {
      schema[`participante_${index + 1}`] = pessoas.find(
        (pessoa) => pessoa.id === participante
      )?.name!;
    });

    console.log(schema);
    await api.post("documentos", {
      modelType: data.tipo_lista,
      documentData: JSON.stringify(schema),
    });

    const maxPages = 12; // Total inicial de páginas
    const participantsPerPage = 5; // Participantes por página
    const requiredPages = Math.ceil(participantes.length / participantsPerPage);
    const countRemovedPages = maxPages - requiredPages;

    // Gera o certificado
    await DocxElementRemover.removeElements(
      Models.DIA_TODO,
      schema,
      "output.docx",
      data.tipo_lista === "lista-dia-todo"
        ? {
            removeTableCount: countRemovedPages,
            removeParagraphCount: countRemovedPages,
          }
        : { removeTableRowCount: countRemovedPages * 7 }
    );

    setIsModalOpen(false);
    form.reset();
    fetchData();
    toast.success("Lista de presença gerada com sucesso");
  };

  const fetchData = async () => {
    try {
      const documentosResp = await api.get(
        "documentos/lista-dia-todo,lista-meio-periodo"
      );
      const treinamentosResp = await api.get("eventos");
      const participantesResp = await api.get("pessoas");

      setDocumentos(documentosResp.data.data);
      setEventos(treinamentosResp.data.data);
      setPessoas(participantesResp.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleParticipante = (
    isChecked: boolean | string,
    participante: Pessoa
  ) => {
    if (isChecked) {
      setParticipantes((prev) => [...prev, participante.id]);
    } else {
      setParticipantes((prev) =>
        prev.filter((participanteId) => participanteId !== participante.id)
      );
    }
  };

  const handleDownload = async (documentoId: string) => {
    const response = await api.get(`documentos`);
    const documentoFiltrado = response.data.data.find(
      (documento: any) => documento.id === documentoId
    );
    const data = JSON.parse(documentoFiltrado.documentData);
    gerarLista(data);
  };

  useEffect(() => {
    setLoading(true);
    fetchData().then(() => setLoading(false));
  }, []);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Presença</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                form.reset();
                setParticipantes([]);
              }
              setIsModalOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Gerar Nova Lista de Presença
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Lista de Presença</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-2 flex flex-col gap-5"
                >
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="tipo_lista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de lista</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de lista" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lista-dia-todo">
                                  Lista do Dia Todo
                                </SelectItem>
                                <SelectItem value="lista-meio-periodo">
                                  Lista do Meio Período
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evento</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o evento" />
                              </SelectTrigger>
                              <SelectContent>
                                {eventos.map((evento) => (
                                  <SelectItem key={evento.id} value={evento.id}>
                                    {evento.treinamento.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="modulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Módulo</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o módulo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TEÓRICO">
                                    Teórico
                                  </SelectItem>
                                  <SelectItem value="PRÁTICO">
                                    Prático
                                  </SelectItem>
                                  <SelectItem value="TEÓRICO E PRÁTICO">
                                    Teórico e Prático
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-3 justify-end w-full">
                        <Label htmlFor="local_treinamento">Participantes</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="justify-start font-normal"
                            >
                              Selecione os Participantes
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[22rem]">
                            {pessoas.map((pessoa) => (
                              <DropdownMenuCheckboxItem
                                key={pessoa.id}
                                checked={participantes.includes(pessoa.id)}
                                onCheckedChange={(isChecked) =>
                                  handleParticipante(isChecked, pessoa)
                                }
                              >
                                {pessoa.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <FormField
                        control={form.control}
                        name="intervalo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intervalo</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  placeholder="Início"
                                  onChange={(e) => {
                                    const startTime = e.target.value;
                                    const endTime =
                                      field.value?.split(" ÀS ")[1] || "";
                                    field.onChange(
                                      `${startTime} ÀS ${endTime}`
                                    );
                                  }}
                                  value={field.value?.split(" ÀS ")[0] || ""}
                                />
                                <span>ÀS</span>
                                <Input
                                  type="time"
                                  placeholder="Fim"
                                  onChange={(e) => {
                                    const startTime =
                                      field.value?.split(" ÀS ")[0] || "";
                                    const endTime = e.target.value;
                                    field.onChange(
                                      `${startTime} ÀS ${endTime}`
                                    );
                                  }}
                                  value={field.value?.split(" ÀS ")[1] || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        form.reset();
                        setParticipantes([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-28 ">
                      Gerar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo de lista</TableHead>
              <TableHead>Data de emissão</TableHead>
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
            ) : documentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      As listas de presença ainda não foram geradas
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documentos.map((documento) => (
                <TableRow key={documento.id}>
                  <TableCell
                    className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                  >
                    Lista de Presença
                  </TableCell>
                  <TableCell className="py-2">
                    {documento.modelType === "lista-dia-todo"
                      ? "Lista do Dia Todo"
                      : "Lista do Meio Período"}
                  </TableCell>
                  <TableCell className="py-2">
                    {documento.createdAt
                      .split("T")[0]
                      .split("-")
                      .reverse()
                      .join("/")}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      onClick={() => handleDownload(documento.id)}
                    >
                      <BookUp2 className="" />
                      Baixar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ListaPresenca;
