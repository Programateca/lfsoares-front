/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "./ui/button";
import { api } from "@/lib/axios";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  BookUp2,
  CircleX,
  ImageDownIcon,
  Loader2,
  Plus,
  RotateCcw,
  Trash2Icon,
} from "lucide-react";
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
import { formatDataRealizada } from "@/utils/formatDataRealizada";
import { Status } from "@/@types/Status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

const defaultValues = {
  documento_identificador: "",
  image1: "",
  image2: "",
};

interface Certificado {
  code: number;
  expires: boolean;
  expiryDate: string;
  documentData: string;
  modelType: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
}

type NewCertificado = typeof defaultValues;

const Certificados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentosIdentificador, setIdentificadores] = useState<
    Identificador[]
  >([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, ArrayBuffer>>({});
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    id: string | number;
    status: number;
  } | null>(null);

  const [newCertificado, setNewCertificado] =
    useState<NewCertificado>(defaultValues);

  const localEmissao = useRef<HTMLInputElement>(null);

  // Estados para busca e ordenação
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const [showInativos, setShowInativos] = useState(false);

  const fetchData = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("identificadores", {
        params: { limit: 100000 },
      });
      setIdentificadores(response.data.data);
      const eventosResp = await api.get("eventos", {
        params: { limit: 100000 },
      });
      const pessoasResp = await api.get("pessoas", {
        params: { limit: 100000 },
      });
      const instrutoresResp = await api.get("instrutores", {
        params: { limit: 100000 },
      });
      const empresasResp = await api.get("empresas", {
        params: { limit: 100000 },
      });
      setEmpresas(empresasResp.data.data);
      setParticipantes(pessoasResp.data.data);
      setInstrutores(instrutoresResp.data.data);
      setEventos(eventosResp.data.data);
      const certificadosResp = await api.get(
        "documentos/certificado-1a,certificado-2a,certificado-3a,certificado-4a",
        {
          params: { page: pageNumber, limit },
        }
      );

      setCertificados(certificadosResp.data.data || []);
      setHasNextPage(certificadosResp.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar dados");
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
      const response = await api.get(
        "documentos/certificado-1a,certificado-2a,certificado-3a,certificado-4a",
        {
          params: { page: newPage, limit },
        }
      );
      setCertificados(response.data.data || []);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    inicializarFetch();
  }, [isModalOpen]);

  const handleInputChange = (name: string, value: string) => {
    setNewCertificado((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const participantesIdentificador = Object.keys(dataIdentificador)
        .filter((key) => key.startsWith("p_id") && dataIdentificador[key])
        .map((key) => ({ id: dataIdentificador[key].trim() }))
        .filter((p) => p.id);

      const assinantesIdentificador = Object.keys(dataIdentificador)
        .filter(
          (key) => key.startsWith("assinante_titulo") && dataIdentificador[key]
        )
        .map((key) => ({ id: dataIdentificador[key].trim() }));
      const assinantesIdentificadorNomes = Object.keys(dataIdentificador)
        .filter(
          (key) =>
            key.startsWith("assinante") &&
            !key.includes("titulo") &&
            dataIdentificador[key]
        )
        .map((key) => {
          const nome = dataIdentificador[key].split(" - ")[0].trim();
          return { id: nome };
        });

      const empresaIdentificador = dataIdentificador.empresa_id;
      const eventoIdentificador = dataIdentificador.evento_id;
      const newCertificado = {
        tipo_certificado: dataIdentificador.tipo_certificado,
        evento: { id: dataIdentificador.evento_id },
        instrutor: { id: "" },
        empresa: { id: dataIdentificador.empresa_id },
        participantes: participantesIdentificador,
        assinantes: assinantesIdentificador,
        assinantes_nomes: assinantesIdentificadorNomes,
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

      if (!selectedParticipantes.length)
        throw new AppError("Selecione um participante", 404);
      if (!selectedEmpresa) throw new AppError("Empresa não encontrado", 404);
      if (!selectedEvento) throw new AppError("Evento não encontrado", 404);

      const datasRealizada = selectedEvento.courseDate;
      const dataRealizada = formatDataRealizada(
        datasRealizada,
        selectedEvento.courseTime,
        selectedEvento.treinamento.courseHours
      );
      const lastItem = datasRealizada[datasRealizada.length - 1];
      const lastItemDia = lastItem.split("-")[2];
      const lastItemMes = lastItem.split("-")[1];
      const lastItemAno = lastItem.split("-")[0];
      const meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];

      const mesString = meses[parseInt(lastItemMes, 10) - 1];

      const schema = {
        nome_treinamento: selectedEvento?.treinamento?.name || "",
        cnpj: selectedEmpresa?.cnpj || "",
        datas_realizadas: dataRealizada || "",
        e_dia: lastItemDia || "",
        e_mes: mesString.toUpperCase() || "",
        e_ano: lastItemAno || "",
        carga_hora: selectedEvento?.treinamento?.courseHours || "",
        local_emissao: newCertificado.local_emissao || "",
        titulo_treinamento: selectedEvento?.treinamento?.name || "",
        portaria_treinamento: selectedEvento?.treinamento?.coursePortaria || "",
        modalidade: selectedEvento?.treinamento?.courseModality || "",
        metodologia: selectedEvento?.treinamento?.courseMethodology || "",
        tipo_formacao: selectedEvento?.treinamento?.courseType || "",
        carga_horaria: selectedEvento?.treinamento?.courseHours || "",
        conteudo: newCertificado.conteudo_aplicado || "",
        nome_responsavel_tecnico: newCertificado.nome_responsavel_tecnico || "",
        local_treinamento: selectedEvento?.courseLocation2
          ? `${selectedEvento.courseLocation} | ${selectedEvento.courseLocation2}`
          : selectedEvento?.courseLocation || "",
        contratante: selectedEmpresa?.name || "",
        contratante_cnpj: selectedEmpresa?.cnpj || "",
        assinatura_1: newCertificado?.assinantes[0]?.id || "",
        assinatura_2: newCertificado?.assinantes[1]?.id || "",
        assinatura_3: newCertificado?.assinantes[2]?.id || "",
        assinatura_4: newCertificado?.assinantes[3]?.id || "",
        nome1:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[0]?.id
          )?.name || "",
        nome2:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[1]?.id
          )?.name || "",
        nome3:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[2]?.id
          )?.name || "",
        nome4:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[3]?.id
          )?.name || "",
        qualificacao_profissional1:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[0]?.id
          )?.qualificacaoProfissional || "",
        qualificacao_profissional2:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[1]?.id
          )?.qualificacaoProfissional || "",
        qualificacao_profissional3:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[2]?.id
          )?.qualificacaoProfissional || "",
        qualificacao_profissional4:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[3]?.id
          )?.qualificacaoProfissional || "",
        registro_qualificacao1:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[0]?.id
          )?.registroProfissional || "",
        registro_qualificacao2:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[1]?.id
          )?.registroProfissional || "",
        registro_qualificacao3:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[2]?.id
          )?.registroProfissional || "",
        registro_qualificacao4:
          instrutores.find(
            (item) => item.name === newCertificado.assinantes_nomes[3]?.id
          )?.registroProfissional || "",
      };

      const dados = [];
      for (const pessoa of selectedParticipantes) {
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

      const assinaturasCount = [
        newCertificado?.assinantes[0]?.id,
        newCertificado?.assinantes[1]?.id,
        newCertificado?.assinantes[2]?.id,
        newCertificado?.assinantes[3]?.id,
      ].filter(Boolean).length;

      const newCertificados: DocumentData = {
        treinamento: selectedEvento.treinamento.name,
        modelType: `certificado-${assinaturasCount}a`,
        documentData: JSON.stringify(dados),
        year: String(identificadorValido.certificateYear),
      };
      const saveResponse = await api.post("documentos", newCertificados);

      if (saveResponse?.status === 201) {
        toast.success("Identificador gerado com sucesso!");
        setCertificados((prev) => [...prev, saveResponse.data.data]);
        setIsModalOpen(false);
      } else {
        toast.error("Erro ao gerar identificador!");
      }
    } catch (error) {
      console.error("Erro ao fazer parse do documentData:", error);
      throw new AppError("Erro ao processar dados do documento", 400);
    }
  };

  const handleDownload = async (
    certificado: DocumentData,
    modelType: string
  ) => {
    const data = JSON.parse(certificado.documentData) as Record<
      string,
      string
    >[];
    gerarCertificado(data, imageMap, modelType.split("-")[1]);
  };

  const handleDownload2 = async (
    e: React.FormEvent,
    certificado: DocumentData
  ) => {
    e.preventDefault();
    const data = JSON.parse(certificado.documentData) as Record<
      string,
      string
    >[];
    gerarCertificado(data, imageMap, certificado.modelType.split("-")[1]);
    setIsModalOpen2(false);
    resetForm();
  };

  const resetForm = () => {
    setNewCertificado({ ...defaultValues });
  };

  // Funções de ordenação e filtragem da tabela
  const handleSort = (column: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === column) {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(direction);
  };

  const filteredCertificates = certificados.filter((cert) => {
    const name = cert?.modelType || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedCertificates = filteredCertificates.slice().sort((a, b) => {
    if (!sortColumn) return 0;
    if (sortColumn === "nome") {
      const aName = a.modelType || "";
      const bName = b.modelType || "";
      return sortDirection === "asc"
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    }
    if (sortColumn === "data") {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }
    return 0;
  });

  const handleUpdateStatus = async (id: string | number, status: number) => {
    try {
      await api.patch(`documentos/${id}`, {
        status: {
          id: status,
        },
      });
      if (status === 1)
        toast("Certificado reativado!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Certificado inativado!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchData();
    } catch (error) {}
  };

  const filteredData = showInativos
    ? sortedCertificates.filter((p) => p.status?.id === 2)
    : sortedCertificates.filter((p) => p.status?.id === 1);

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
          <Button
            onClick={() => setShowInativos((prev) => !prev)}
            className="bg-white border border-black text-black hover:bg-black hover:text-white"
          >
            {showInativos ? "Ocultar Inativos" : "Mostrar Inativos"}
          </Button>
        </div>

        {/* Barra de pesquisa */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Buscar certificado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabela com cabeçalhos clicáveis para ordenação */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("nome")}
                className="cursor-pointer"
              >
                Nome{" "}
                {sortColumn === "nome"
                  ? sortDirection === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </TableHead>
              <TableHead
                onClick={() => handleSort("data")}
                className="cursor-pointer"
              >
                Data de emissão{" "}
                {sortColumn === "data"
                  ? sortDirection === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loader"></div>
                    <Loader2 className="text-lg mr-2 animate-spin text-gray-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhum certificado encontrado.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((certificado, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium max-w-[20rem] overflow-hidden whitespace-nowrap overflow-ellipsis py-2">
                    {certificado?.modelType
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
                      ? new Date(certificado.createdAt).toLocaleString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "Data não disponível"}
                  </TableCell>
                  <TableCell className="text-end space-x-2 whitespace-nowrap py-2">
                    <Dialog open={isModalOpen2} onOpenChange={setIsModalOpen2}>
                      <DialogTrigger asChild>
                        <Button
                          className="p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                          variant={"outline"}
                        >
                          <ImageDownIcon className="mr-1" />
                          Alterar Capas
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>
                            Geração de Certificado com nova capa
                          </DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) =>
                            handleDownload2(e, {
                              ...certificado,
                              treinamento: "",
                              year: "",
                            })
                          }
                        >
                          <div className="grid grid-cols-3 gap-4 max-h-[80vh]">
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
                                          ["image1.jpeg"]:
                                            reader.result as ArrayBuffer,
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
                                          ["image2.jpeg"]:
                                            reader.result as ArrayBuffer,
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
                                setIsModalOpen2(false);
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
                    <Button
                      variant={"outline"}
                      className="p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      onClick={() =>
                        handleDownload(
                          { ...certificado, treinamento: "", year: "" },
                          certificado.modelType
                        )
                      }
                    >
                      <BookUp2 className="h-4 w-4 mr-1" />
                      Baixar certificados
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="p-2 h-fit hover:bg-red-100 hover:border-red-200"
                          onClick={() =>
                            setSelectedItem({
                              id: certificado.id,
                              status: certificado.status?.id === 1 ? 2 : 1,
                            })
                          }
                        >
                          {certificado.status?.id === 1 ? (
                            <Trash2Icon className="h-4 w-4" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {certificado.status?.id === 1
                              ? "Inativar certificado?"
                              : "Reativar certificado?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {certificado.status?.id === 1
                              ? "Tem certeza que deseja inativar este certificado?"
                              : "Tem certeza que deseja reativar este certificado?"}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="w-20">
                            Não
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="w-20"
                            onClick={() => {
                              if (selectedItem) {
                                handleUpdateStatus(
                                  selectedItem.id,
                                  selectedItem?.status
                                );
                                setSelectedItem(null);
                              }
                            }}
                          >
                            Sim
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Controles de paginação */}
        {typeof page === "number" && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Voltar Tudo
            </Button>
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Voltar uma página
            </Button>
            <Button
              variant="outline"
              disabled={!hasNextPage}
              onClick={() => handlePageChange(page + 1)}
            >
              Próxima página
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Certificados;
