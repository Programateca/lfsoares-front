/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "./ui/button";

import { api } from "@/lib/axios";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BookUp2, CircleX, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

import { Evento } from "@/@types/Evento";
import { Pessoa } from "@/@types/Pessoa";
import { SelectMap } from "./SelectMap";
import { Instrutor } from "@/@types/Instrutor";
import { AppError } from "@/utils/AppError";
import { Empresa } from "@/@types/Empresa";
import { gerarCertificado } from "@/utils/gerar-certificado";
import { Identificador } from "@/@types/Identificador";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { DocumentData } from "@/@types/DocumentData";
import toast from "react-hot-toast";

const defaultValues = {
  documento_identificador: "",
  image1: "",
  image2: "",
};

type NewCertificado = typeof defaultValues;

const Certificados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentosIdentificador, setIdentificadores] = useState<
    Identificador[]
  >([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, ArrayBuffer>>({});
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [certificados, setCertificados] = useState<any[]>([]);

  const [newCertificado, setNewCertificado] =
    useState<NewCertificado>(defaultValues);

  const localEmissao = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const response = await api.get("identificadores");
      setIdentificadores(response.data.data);
      const eventosResp = await api.get("eventos");
      const pessoasResp = await api.get("pessoas");
      const instrutoresResp = await api.get("instrutores");
      const empresasResp = await api.get("empresas");
      setEmpresas(empresasResp.data.data);
      setParticipantes(pessoasResp.data.data);
      setInstrutores(instrutoresResp.data.data);
      setEventos(eventosResp.data.data);
      const [certificados2aResp, certificados3aResp, certificados4aResp] =
        await Promise.all([
          api.get("documentos/certificado-2a"),
          api.get("documentos/certificado-3a"),
          api.get("documentos/certificado-4a"),
        ]);
      setCertificados([
        ...certificados2aResp.data.data,
        ...certificados3aResp.data.data,
        ...certificados4aResp.data.data,
      ]);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao buscar dados");
    }
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    inicializarFetch();
  }, [isModalOpen]);

  /**
   * Função para capturar os valores dos inputs
   * **/
  const handleInputChange = (name: string, value: string) => {
    setNewCertificado((prev) => ({ ...prev, [name]: value }));
  };

  /**
   *  Função para gerar os certificados
   * **/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Log 1: Verificar o identificador selecionado
    const identificadorSelecionado = newCertificado.documento_identificador;
    const identificadorValido = documentosIdentificador.find(
      (doc) => doc.id === identificadorSelecionado
    );

    if (!identificadorValido) {
      throw new AppError("Identificador não encontrado", 404);
    }

    try {
      const dataIdentificador = JSON.parse(
        identificadorValido.identificadorData
      );
      // Log 4: Verificar os dados após o parse

      const participantesIdentificador = Object.keys(dataIdentificador)
        .filter((key) => key.startsWith("p_id") && dataIdentificador[key])
        .map((key) => ({ id: dataIdentificador[key].trim() }))
        .filter((p) => p.id);
      const empresaIdentificador = dataIdentificador.empresa_id;
      const eventoIdentificador = dataIdentificador.evento_id;
      const newCertificado = {
        tipo_certificado: dataIdentificador.tipo_certificado,
        evento: { id: dataIdentificador.evento_id },
        instrutor: { id: "" },
        empresa: { id: dataIdentificador.empresa_id },
        participantes: participantesIdentificador,
        // Frente
        nome_participante: "",
        portaria_treinamento: dataIdentificador.coursePortaria,
        nome_treinamento: "",
        cnpj: "",
        realizacao_data_e_hora: "",
        carga_hora: "",
        local_emissao: localEmissao.current?.value || "",
        codigo_certificado: Object.keys(dataIdentificador)
          .filter((key) => key.startsWith("p_codigo"))
          .map((key) => dataIdentificador[key]),
        // Verso
        nome_instrutor: "",
        matricula_instrutor: "",
        formacao_instrutor: "",
        conteudo_aplicado: dataIdentificador.conteudo_aplicado,
        tipo_formacao: "",
        nome_responsavel_tecnico: "",
        formacao_responsavel_tecnico: "",
        crea_responsavel_tecnico: "",
        local_treinamento: "",
        contratante: "",
        image1: "",
        image2: "",
      };
      const selectedParticipantes = participantes.filter((participante) =>
        participantesIdentificador.map((p) => p.id).includes(participante.id)
      );
      const selectedEmpresa = empresas.find(
        (empresa) => empresa.id === empresaIdentificador
      );
      const selectedEvento = eventos.find(
        (evento) => evento.id === eventoIdentificador
      );
      // const selectedInstrutor = instrutores.find(
      //   (instrutor) => instrutor.id === newCertificado?.instrutor?.id
      // );
      if (!selectedParticipantes.length)
        throw new AppError("Selecione um participante", 404);
      if (!selectedEmpresa) throw new AppError("Empresa não encontrado", 404);
      if (!selectedEvento) throw new AppError("Evento não encontrado", 404);
      // if (!selectedInstrutor) throw new AppError("Instrutor não encontrado", 404);

      const dataRealizada1 = selectedEvento.courseDate.split("T")[0].split("-"); // [YYYY,MM,DD]
      const dataRealizada2 = selectedEvento.completionDate
        .split("T")[0]
        .split("-"); // [HH,MM]
      let dataRealizada = "";
      if (dataRealizada2.length < 2) {
        dataRealizada = `${dataRealizada1[2]} do ${dataRealizada1[1]} de ${dataRealizada1[0]}`;
      } else {
        dataRealizada = `${dataRealizada1[2]} do ${dataRealizada1[1]} ao dia ${dataRealizada2[2]} do ${dataRealizada2[1]} de ${dataRealizada2[0]}`;
      }
      const timeRealizada1 = selectedEvento.courseTime.split("ÀS")[0]; // [HH,MM]
      const timeRealizada2 = selectedEvento.courseTime.split("ÀS")[1]; // [HH,MM]
      const dataEmissao = new Date().toISOString().split("T")[0].split("-"); // [YYYY,MM,DD]

      const schema = {
        // Frente
        nome_treinamento: selectedEvento.treinamento.name,
        empresa: selectedEmpresa.name,
        cnpj: selectedEmpresa.cnpj,
        data_realizada: dataRealizada,
        r_hora_1: timeRealizada1, // Hora de Realização
        r_hora_2: timeRealizada2, // Minutos de Realização
        e_dia: dataEmissao[2], // Dia de Emissão
        e_mes: dataEmissao[1], // Mes de Emissão
        carga_hora: selectedEvento.treinamento.courseHours,
        local_emissao: newCertificado.local_emissao,
        // Verso
        // nome_instrutor: selectedInstrutor.name,
        // matricula_instrutor: selectedInstrutor.matricula ?? "",
        // formacao_instrutor: selectedInstrutor.qualificacaoProfissional ?? "",
        // formacao_responsavel_tecnico: newCertificado.formacao_responsavel_tecnico,
        // crea_responsavel_tecnico: newCertificado.crea_responsavel_tecnico,
        titulo_treinamento: selectedEvento.treinamento.name,
        portaria_treinamento: selectedEvento.treinamento.coursePortaria,
        modalidade: selectedEvento.treinamento.courseModality,
        metodologia: selectedEvento.treinamento.courseMethodology,
        tipo_formacao: selectedEvento.treinamento.courseType,
        carga_horaria: selectedEvento.treinamento.courseHours,
        conteudo: newCertificado.conteudo_aplicado,
        nome_responsavel_tecnico: newCertificado.nome_responsavel_tecnico,
        local_treinamento: selectedEvento.courseLocation2
          ? `${selectedEvento.courseLocation} | ${selectedEvento.courseLocation2}`
          : selectedEvento.courseLocation,
        contratante: selectedEmpresa.name,
        contratante_cnpj: selectedEmpresa.cnpj,
      };

      const dados = [];
      for (const pessoa of participantesIdentificador) {
        const participanteEncontrado = participantes.find(
          (p) => p.id === pessoa.id
        );

        if (!participanteEncontrado?.name) {
          throw new AppError("Participante invalido", 404);
        }
        if (!schema) {
          throw new AppError("Schema invalido", 404);
        }
        dados.push({
          ...schema,
          nome_participante: participanteEncontrado.name,
          cpf: participanteEncontrado.cpf || "não informado",
          codigo: newCertificado.codigo_certificado.shift().split(" ")[1],
        });
      }
      const newCertificados: DocumentData = {
        treinamento: selectedEvento.treinamento.name,
        modelType: `certificado-${newCertificado.tipo_certificado}a`,
        documentData: JSON.stringify(dados),
        // certificateCode: 10,
        year: String(identificadorValido.certificateYear),
      };

      // const certificadosData = JSON.parse(newCertificados.documentData);

      const saveResponse = await api.post("documentos", newCertificados);

      if (saveResponse.status === 201) {
        toast.success("Identificador gerado com sucesso!");
        setCertificados((prev) => [...prev, saveResponse.data.data]);
        setIsModalOpen(false);
      } else {
        toast.error("Erro ao gerar identificador!");
      }
      // Continue com o resto do código...
    } catch (error) {
      console.error("Erro ao fazer parse do documentData:", error);
      throw new AppError("Erro ao processar dados do documento", 400);
    }
  };

  /**
   * Função para baixar os certificados
   * **/
  const handleDownload = async (
    certificados: DocumentData,
    modelType: string
  ) => {
    // console.log("TESTE");
    const data = JSON.parse(certificados.documentData) as Record<
      string,
      string
    >[];
    // console.log(data);
    // return;
    // data.forEach((certificado: Record<string, string>) => {
    gerarCertificado(data, imageMap, modelType.split("-")[1]);
    // });
  };

  /**
   * Função para resetar os valores do formulário
   * **/
  const resetForm = () => {
    setNewCertificado({
      ...defaultValues,
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Certificados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Gerar Novo Certificado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Geração de Certificado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-3 gap-4 max-h-[80vh]">
                  <div className="space-y-2 col-span-3">
                    <SelectMap
                      input_name="documento_identificador"
                      itens={documentosIdentificador}
                      label="Para gerar os certificados, selecione um dos identificadores de participantes abaixo:"
                      placeholder="Selecione um documento"
                      onChange={(e) =>
                        handleInputChange("documento_identificador", e)
                      }
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Local de Emissão</Label>
                    <Input
                      type="text"
                      className="w-full"
                      name="local_emissao"
                      placeholder="Ex: São Paulo"
                      ref={localEmissao}
                      required
                    />
                  </div>
                  <div className="col-span-3 flex justify-between gap-4">
                    <div className="space-y-2 col-span-3">
                      <label
                        htmlFor="image-upload"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Selecione a capa de frente
                      </label>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setImageMap((prev) => ({
                                ...prev,
                                ["image1.jpeg"]: reader.result as ArrayBuffer,
                              }));
                            };
                            reader.readAsArrayBuffer(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div className="space-y-2 col-span-3">
                      <label
                        htmlFor="image-upload"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Selecione a capa do verso
                      </label>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setImageMap((prev) => ({
                                ...prev,
                                ["image2.jpeg"]: reader.result as ArrayBuffer,
                              }));
                            };
                            reader.readAsArrayBuffer(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-28">
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
            ) : certificados.length === 0 ? (
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
              certificados.map((certificado, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium max-w-[20rem] overflow-hidden whitespace-nowrap overflow-ellipsis py-2">
                    {index + 1}{" "}
                    {certificado?.modelType // Verifica se modelType existe
                      ? `CT${
                          certificado.modelType.split("-")[1] || ""
                        } - Certificados de ${
                          (certificado.modelType.split("-")[1] || "").split(
                            "a"
                          )[0] || ""
                        } assinaturas`
                      : "Modelo de certificado não definido"}
                  </TableCell>
                  <TableCell className="py-2">
                    {certificado?.createdAt
                      ? certificado.createdAt
                          .split("T")[0]
                          .split("-")
                          .reverse()
                          .join("/")
                      : "Data não disponível"}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      onClick={() =>
                        handleDownload(certificado, certificado.modelType)
                      }
                    >
                      <BookUp2 className="" />
                      Baixar certificados
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

export default Certificados;
