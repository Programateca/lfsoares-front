import { Controller, useForm } from "react-hook-form";
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

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import toast from "react-hot-toast";
import { DocumentData } from "@/@types/Document";
import { gerarLista } from "@/utils/gerar-lista";
import { Label } from "./ui/label";

interface Evento {
  identificador_id: string;
  mudar_modulo: string;
  mudar_horarios: string;
  id_code: string;
  id_data: string;
  responsavel_tecnico: string;
  p_nome1: string;
  p_matricula1: string;
  p_codigo1: string;
  p_id1: string;
  p_nome2: string;
  p_matricula2: string;
  p_codigo2: string;
  p_id2: string;
  p_nome3: string;
  p_matricula3: string;
  p_codigo3: string;
  p_id3: string;
  p_nome4: string;
  p_matricula4: string;
  p_codigo4: string;
  p_id4: string;
  p_nome5: string;
  p_matricula5: string;
  p_codigo5: string;
  p_id5: string;
  p_nome6: string;
  p_matricula6: string;
  p_codigo6: string;
  p_id6: string;
  p_nome7: string;
  p_matricula7: string;
  p_codigo7: string;
  p_id7: string;
  p_nome8: string;
  p_matricula8: string;
  p_codigo8: string;
  p_id8: string;
  p_nome9: string;
  p_matricula9: string;
  p_codigo9: string;
  p_id9: string;
  p_nome10: string;
  p_matricula10: string;
  p_codigo10: string;
  p_id10: string;
  numeroParticipantes: number;
  conteudo_aplicado: string;
  motivo_treinamento: string;
  objetivo_lf: string;
  treinamento: string;
  treinamento_lista: string;
  evento_id: string;
  contratante: string;
  tipo: string;
  carga_horaria: string;
  intervalo: string;
  endereco: string;
  empresa: string;
  empresa_id: string;
  datas: string;
  tipo_certificado: string;
  assinante_titulo1: string;
  assinante_titulo2: string;
  assinante_titulo3: string;
  assinante_titulo4: string;
  assinante1: string;
  assinante2: string;
  assinante3: string;
  assinante4: string;
  instrutor_a: string;
  instrutor_b: string;
  instrutorDates: {
    instrutorA: { dia: string; periodo: string }[];
    instrutorB: { dia: string; periodo: string }[];
  };
}

interface FormData {
  identificadores: string;
  tipo_lista: string;
  cidade: string;
}

const ListaPresenca = () => {
  const [identificadores, setIdentificadores] = useState<DocumentData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [documentos, setDocumentos] = useState<
    { id: string; modelType: string; createdAt: string; documentData: string }[]
  >([]);

  const eventos: Evento[] = identificadores.map((identificadores) => ({
    ...JSON.parse(identificadores.documentData),
    identificador_id: identificadores.id,
  }));

  console.log("eventos", eventos);

  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>();

  console.log("Renderizado");

  const onSubmit = async (data: FormData) => {
    console.log("data", data);
    // gerarLista()
  };

  const fetchData = async () => {
    try {
      const documentosResp = await api.get(
        "documentos/lista-dia-todo,lista-meio-periodo"
      );
      const identificadoresResp = await api.get("documentos/identificador");

      setIdentificadores(identificadoresResp.data.data);
      setDocumentos(documentosResp.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownload = async (documentoId: string) => {
    const response = await api.get(`documentos`);
    const documentoFiltrado = response.data.data.find(
      (documento: { id: string }) => documento.id === documentoId
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
                reset();
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

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-2 flex flex-col gap-5"
              >
                <div className="space-y-2">
                  <Controller
                    name="identificadores"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
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
                              <SelectItem
                                key={evento.identificador_id}
                                value={evento.identificador_id}
                              >
                                {evento.treinamento}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  <Controller
                    name="tipo_lista"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label className="text-sm font-medium">
                          Tipo de lista
                        </Label>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
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
                      </div>
                    )}
                  />

                  <Controller
                    name="cidade"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="text-sm font-medium">Cidade</label>
                        <Input placeholder="Cidade" {...field} />
                      </div>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
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
                      <BookUp2 />
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
