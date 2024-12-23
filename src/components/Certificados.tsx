import { Button } from "./ui/button";

import { api } from "@/lib/axios";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { BookUp2, CircleX, List, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  // DropdownMenuLabel,
  // DropdownMenuRadioGroup,
  // DropdownMenuRadioItem,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Evento } from "@/@types/Evento";
import { Pessoa } from "@/@types/Pessoa";
import { SelectMap } from "./SelectMap";
import { Instrutor } from "@/@types/Instrutor";
import { AppError } from "@/utils/AppError";
import { Empresa } from "@/@types/Empresa";
// import { Checkbox } from "./ui/checkbox";
import { gerarCertificado } from "@/utils/gerar-certificado";

const defaultValues = {
  tipo_certificado: "",
  evento: { id: "" },
  instrutor: { id: "" },
  empresa: { id: "" },
  participantes: [] as { id: string }[],
  // Frente
  nome_participante: "",
  portaria_treinamento: "",
  nome_treinamento: "",
  cnpj: "",
  realizacao_data_e_hora: "",
  carga_hora: "",
  codigo_certificado: "",
  local_emissao: "",
  // Verso
  nome_instrutor: "",
  matricula_instrutor: "",
  formacao_instrutor: "",
  descricao: "",
  tipo_formacao: "",
  nome_responsavel_tecnico: "",
  formacao_responsavel_tecnico: "",
  crea_responsavel_tecnico: "",
  local_treinamento: "",
  contratante: "",
  image1: "",
  image2: "",
};

type NewCertificado = typeof defaultValues;

const Certificados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [certificadosGerados, setCertificadosGerados] = useState<any[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, ArrayBuffer>>({});
  const tiposCertificados = [
    {
      id: "certificado-frente-verso",
      name: "Certificado Frente e Verso",
    },
    {
      id: "certificado-ponte-rolante",
      name: "Certificado Ponte",
    },
    {
      id: "certificado-verso",
      name: "Certificado Verso",
    },
  ];
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [newCertificado, setNewCertificado] =
    useState<NewCertificado>(defaultValues);

  const fetchData = async () => {
    try {
      const response = await api.get("documentos/certificado");
      const eventosResp = await api.get("eventos");
      const pessoasResp = await api.get("pessoas");
      const instrutoresResp = await api.get("instrutores");
      const empresasResp = await api.get("empresas");

      setEmpresas(empresasResp.data.data);
      setParticipantes(pessoasResp.data.data);
      setCertificadosGerados(response.data.data);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCertificado((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedParticipantes = participantes.filter((participante) =>
      newCertificado?.participantes?.some((p) => p.id === participante.id)
    );
    const selectedEmpresa = empresas.find(
      (empresa) => empresa.id === newCertificado?.empresa?.id
    );
    const selectedEvento = eventos.find(
      (evento) => evento.id === newCertificado?.evento?.id
    );
    const selectedInstrutor = instrutores.find(
      (instrutor) => instrutor.id === newCertificado?.instrutor?.id
    );
    if (!selectedParticipantes.length)
      throw new AppError("Selecione um participante", 404);
    if (!selectedEmpresa) throw new AppError("Empresa não encontrado", 404);
    if (!selectedEvento) throw new AppError("Evento não encontrado", 404);
    if (!selectedInstrutor) throw new AppError("Instrutor não encontrado", 404);

    const dataRealizada1 = selectedEvento.courseDate.split("T")[0].split("-"); // [YYYY,MM,DD]
    const dataRealizada2 = selectedEvento.completionDate
      .split("T")[0]
      .split("-"); // [HH,MM]
    console.log(dataRealizada1.length);
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
      // Dois lados
      carga_hora: selectedEvento.treinamento.courseHours,
      // Frente
      portaria_treinamento: newCertificado.portaria_treinamento,
      nome_treinamento: selectedEvento.treinamento.name,
      empresa: selectedEmpresa.name,
      cnpj: selectedEmpresa.cnpj,
      data_realizada: dataRealizada,
      r_hora_1: timeRealizada1, // Hora de Realização
      r_horas_2: timeRealizada2, // Minutos de Realização
      e_dia: dataEmissao[2], // Dia de Emissão
      e_mes: dataEmissao[1], // Mes de Emissão
      codigo: newCertificado.codigo_certificado,
      local_emissao: newCertificado.local_emissao,
      // Verso
      nome_instrutor: selectedInstrutor.name,
      matricula_instrutor: selectedInstrutor.matricula ?? "",
      formacao_instrutor: selectedInstrutor.qualificacaoProfissional ?? "",
      descricao: selectedEvento.treinamento.description,
      tipo_formacao: selectedEvento.treinamento.courseType,
      nome_responsavel_tecnico: newCertificado.nome_responsavel_tecnico,
      formacao_responsavel_tecnico: newCertificado.formacao_responsavel_tecnico,
      crea_responsavel_tecnico: newCertificado.crea_responsavel_tecnico,
      local_treinamento: selectedEvento.courseLocation,
      contratante: selectedEmpresa.name,
    };
    for (let pessoa of newCertificado.participantes) {
      const nome_participante = participantes.find(
        (p) => p.id === pessoa.id
      )?.name;
      console.log(nome_participante);
      const cpf = participantes.find((p) => p.id === pessoa.id)?.cpf;

      if (!nome_participante) throw new AppError("Participante invalido", 404);
      // se nao tiver cpf, passar vazio
      // if (!cpf) {
      //   gerarCertificado({ ...schema, nome_participante }, imageMap);
      //   continue;
      // }

      gerarCertificado({ ...schema, nome_participante, cpf }, imageMap);
    }
  };

  const handleParticipante = (
    isChecked: boolean | string,
    participante: Pessoa
  ) => {
    if (isChecked) {
      setNewCertificado((prev) => ({
        ...prev,
        participantes: [...prev.participantes, { id: participante.id }],
      }));
    } else {
      setNewCertificado((prev) => ({
        ...prev,
        participantes: prev.participantes.filter(
          (p) => p.id !== participante.id
        ),
      }));
    }
  };

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
                      input_name="tipo_certificado"
                      itens={tiposCertificados}
                      label="Para gerar o's certificado's, selecione um dos identificadores de participantes abaixo:"
                      placeholder="Selecione um documento"
                      onChange={(value) =>
                        setNewCertificado((prev) => ({
                          ...prev,
                          tipo_certificado: value,
                        }))
                      }
                    />
                    <p className="text-sm text-gray-500">
                      O certificado gerado sera o modelo de{" "}
                    </p>
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
                      setIsModalOpen(false), resetForm();
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
            ) : certificadosGerados.length === 0 ? (
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
              certificadosGerados.map((certificado) => (
                <TableRow key={certificado.id}>
                  <TableCell
                    className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                  >
                    {certificado.modelType}
                  </TableCell>
                  <TableCell className="py-2">
                    {certificado.createdAt
                      .split("T")[0]
                      .split("-")
                      .reverse()
                      .join("/")}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                    >
                      <BookUp2 className="" />
                      Baixar certificados
                    </Button>
                    {/* <Button
                      variant={"outline"}
                      className="p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                    >
                      <List className="" />
                      Listagem
                    </Button> */}
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
