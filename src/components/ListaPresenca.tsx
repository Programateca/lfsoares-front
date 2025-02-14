/* eslint-disable @typescript-eslint/no-unused-vars */
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
  SelectItem,
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
// import toast from "react-hot-toast";
// import { DocumentData } from "@/@types/DocumentData";
import { gerarLista } from "@/utils/gerar-lista";
import { Label } from "./ui/label";
import { SelectMap } from "./SelectMap";
import { IdentificadorData } from "@/@types/IdentificadorData";
import toast from "react-hot-toast";
// import { DocxElementRemover } from "@/utils/docx-element-remover";
// import { ModelType } from "@/@types/ModeType";

// interface Evento {
//   identificador_id: string;
//   mudar_modulo: string;
//   mudar_horarios: string;
//   id_code: string;
//   id_data: string;
//   responsavel_tecnico: string;
//   p_nome1: string;
//   p_matricula1: string;
//   p_codigo1: string;
//   p_id1: string;
//   p_nome2: string;
//   p_matricula2: string;
//   p_codigo2: string;
//   p_id2: string;
//   p_nome3: string;
//   p_matricula3: string;
//   p_codigo3: string;
//   p_id3: string;
//   p_nome4: string;
//   p_matricula4: string;
//   p_codigo4: string;
//   p_id4: string;
//   p_nome5: string;
//   p_matricula5: string;
//   p_codigo5: string;
//   p_id5: string;
//   p_nome6: string;
//   p_matricula6: string;
//   p_codigo6: string;
//   p_id6: string;
//   p_nome7: string;
//   p_matricula7: string;
//   p_codigo7: string;
//   p_id7: string;
//   p_nome8: string;
//   p_matricula8: string;
//   p_codigo8: string;
//   p_id8: string;
//   p_nome9: string;
//   p_matricula9: string;
//   p_codigo9: string;
//   p_id9: string;
//   p_nome10: string;
//   p_matricula10: string;
//   p_codigo10: string;
//   p_id10: string;
//   numeroParticipantes: number;
//   conteudo_aplicado: string;
//   motivo_treinamento: string;
//   objetivo_lf: string;
//   treinamento: string;
//   treinamento_lista: string;
//   evento_id: string;
//   contratante: string;
//   tipo: string;
//   carga_horaria: string;
//   intervalo: string;
//   endereco: string;
//   empresa: string;
//   empresa_id: string;
//   datas: string;
//   tipo_certificado: string;
//   assinante_titulo1: string;
//   assinante_titulo2: string;
//   assinante_titulo3: string;
//   assinante_titulo4: string;
//   assinante1: string;
//   assinante2: string;
//   assinante3: string;
//   assinante4: string;
//   instrutor_a: string;
//   instrutor_b: string;
//   instrutorDates: {
//     instrutorA: { dia: string; periodo: string }[];
//     instrutorB: { dia: string; periodo: string }[];
//   };
// }

export interface ListaFormData {
  documento_identificador: string;
  tipo_lista: string;
  cidade: string;
}

const ListaPresenca = () => {
  const [identificadores, setIdentificadores] = useState<IdentificadorData[]>(
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documentos, setDocumentos] = useState<any[]>([]);
  const { control, handleSubmit, reset, setValue } = useForm<ListaFormData>();

  const onSubmit = async (data: ListaFormData) => {
    const identificadorSelecionado = data.documento_identificador;
    const identificadorValido = identificadores.find(
      (doc) => doc.id === identificadorSelecionado
    );

    if (identificadorValido) {
      const dataIdentificador = JSON.parse(
        identificadorValido.identificadorData
      );

      const empresaCNPJ = empresas.find(
        (empresa) => empresa.id === dataIdentificador.empresa_id
      ).cnpj;

      const schema: Record<string, string> = {
        nome_treinamento: dataIdentificador.treinamento,
        tipo: dataIdentificador.tipo,
        carga_horaria: `${dataIdentificador.carga_horaria} HORAS/AULA`,
        datas: dataIdentificador.datas,
        horario: dataIdentificador.mudar_horarios,
        intervalo: dataIdentificador.intervalo,
        modulo: dataIdentificador.mudar_modulo,
        endereco: dataIdentificador.endereco,
        instrutor: dataIdentificador.assinante1,
        cidade: data.cidade,
        nome_empresa: dataIdentificador.empresa,
        cnpj: empresaCNPJ,
      };

      const pessoas: { id: string; name: string }[] = [];

      for (let i = 1; i <= 60; i++) {
        const pessoaId = dataIdentificador[`p_id${i}`];
        const pessoaNome = dataIdentificador[`p_nome${i}`];
        if (pessoaId && pessoaNome) {
          pessoas.push({ id: pessoaId, name: pessoaNome });
        }
      }

      const participantes = pessoas.map((pessoa) => pessoa.id);
      participantes.forEach((participanteId, index) => {
        const key = `p_${(index + 1).toString().padStart(2, "0")}`;
        schema[key] =
          pessoas.find((pessoa) => pessoa.id === participanteId)?.name || "";
      });

      const requiredFields = Math.ceil(participantes.length / 5) * 5;
      for (let i = participantes.length; i < requiredFields; i++) {
        const key = `p_${(i + 1).toString().padStart(2, "0")}`;
        schema[key] = " ";
      }

      // gerarLista(
      //   { ...schema, numberOfParticipantes: participantes.length },
      //   data.tipo_lista
      // );

      const newLista = {
        year: new Date().getFullYear().toString(),
        modelType: data.tipo_lista,
        documentData: JSON.stringify({
          ...schema,
          numberOfParticipantes: participantes.length,
          tipo_lista: data.tipo_lista,
        }),
      };

      setIsModalOpen(false);
      const result = await api.post("documentos", newLista).catch((error) => {
        console.error(error);
        toast.error("Erro ao gerar lista de presença");
      });

      if (result && result.status === 201) {
        toast.success("Lista de presença gerada com sucesso");
      }
    } else {
      toast.error("Identificador inválido");
    }
  };

  const fetchData = async () => {
    try {
      const documentosResp = await api.get(
        "documentos/lista-dia-todo,lista-meio-periodo"
      );
      const identificadoresResp = await api.get("identificadores");
      const response = await api.get("empresas");

      setEmpresas(response.data.data);
      setIdentificadores(identificadoresResp.data.data);
      setDocumentos(documentosResp.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setValue(name as keyof ListaFormData, value);
  };

  const handleDownload = async (documentoId: string) => {
    const documentoFiltrado = documentos.find(
      (documento: { id: string }) => documento.id === documentoId
    );
    const data = JSON.parse(documentoFiltrado.documentData);

    gerarLista(data, data.tipo_lista);
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
                // setParticipantes([]);
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
                  <SelectMap
                    input_name="documento_identificador"
                    itens={identificadores}
                    label="Para gerar os certificados, selecione um dos identificadores de participantes abaixo:"
                    placeholder="Selecione um documento"
                    onChange={(e) =>
                      handleInputChange("documento_identificador", e)
                    }
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
                      // setParticipantes([]);
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
