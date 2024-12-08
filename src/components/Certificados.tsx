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
};

type NewCertificado = typeof defaultValues;

const Certificados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [certificadosGerados, setCertificadosGerados] = useState<any[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [newCertificado, setNewCertificado] =
    useState<NewCertificado>(defaultValues);

  const fetchData = async () => {
    try {
      const response = await api.get("documentos");
      const eventosResp = await api.get("eventos");
      const pessoasResp = await api.get("pessoas");
      const instrutoresResp = await api.get("instrutores");
      const empresasResp = await api.get("empresas");

      // console.log(empresasResp.data);

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
      throw new AppError("Selecione um participante", 404); // TODO
    if (!selectedEmpresa) throw new AppError("Empresa não encontrado", 404);
    if (!selectedEvento) throw new AppError("Evento não encontrado", 404);
    if (!selectedInstrutor) throw new AppError("Instrutor não encontrado", 404);

    // const User = z.object({
    //   username: z.string(),
    // });

    const dataAndTimeRealizada =
      newCertificado.realizacao_data_e_hora.split("T");
    const dataRealizada = dataAndTimeRealizada[0].split("-"); // [YYYY,MM,DD]
    const timeRealizada = dataAndTimeRealizada[1].split(":"); // [HH,MM]

    const dataEmissao = new Date().toISOString().split("T")[0]; // [YYYY,MM,DD]

    const schema = {
      // Dois lados
      carga_hora: selectedEvento.treinamento.courseHours,
      // Frente
      // nome_participante: "Vitor Teste", // Passar dinaimcamente na criação do certificado
      portaria_treinamento: newCertificado.portaria_treinamento,
      nome_treinamento: selectedEvento.treinamento.name,
      empresa: selectedEmpresa.name,
      cnpj: selectedEmpresa.cnpj,
      r_dia: dataRealizada[2], // Dia de Realização
      r_mes: dataRealizada[1], // Mes de Realização
      r_hora: timeRealizada[0], // Hora de Realização
      r_minutos: timeRealizada[1], // Minutos de Realização
      e_dia: dataEmissao[2], // Dia de Emissão
      e_mes: dataEmissao[1], // Mes de Emissão
      codigo: newCertificado.codigo_certificado,
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
      const cpf = participantes.find((p) => p.id === pessoa.id)?.cpf;

      if (!nome_participante) throw new AppError("Participante invalido", 404);
      if (!cpf) throw new AppError("CPF invalido", 404);
      console.log(cpf);
      gerarCertificado({ ...schema, nome_participante, cpf });
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
  console.log(newCertificado);
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
                  <div className="space-y-2 col-span-2">
                    <SelectMap
                      input_name="evento"
                      itens={eventos ?? []}
                      label="Evento"
                      placeholder="Selecione o Evento"
                      onChange={(value) =>
                        setNewCertificado((prev) => ({
                          ...prev,
                          evento: { id: value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <SelectMap
                      input_name="empresa"
                      itens={empresas ?? []}
                      label="Empresa"
                      placeholder="Selecione a Empresa"
                      onChange={(value) =>
                        setNewCertificado((prev) => ({
                          ...prev,
                          empresa: { id: value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="realizacao_data_e_hora">
                      Data e Hora de Realização
                    </Label>
                    <Input
                      id="realizacao_data_e_hora"
                      name="realizacao_data_e_hora"
                      type="datetime-local"
                      value={newCertificado?.realizacao_data_e_hora}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portaria_treinamento">
                      Portaria do Treinamento
                    </Label>
                    <Input
                      id="portaria_treinamento"
                      name="portaria_treinamento"
                      value={newCertificado?.portaria_treinamento}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_responsavel_tecnico">
                      Nome do Responsável Técnico
                    </Label>
                    <Input
                      id="nome_responsavel_tecnico"
                      name="nome_responsavel_tecnico"
                      value={newCertificado?.nome_responsavel_tecnico}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formacao_responsavel_tecnico">
                      Formação do Responsável Técnico
                    </Label>
                    <Input
                      id="formacao_responsavel_tecnico"
                      name="formacao_responsavel_tecnico"
                      value={newCertificado?.formacao_responsavel_tecnico}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crea_responsavel_tecnico">
                      Crea do Responsável Técnico
                    </Label>
                    <Input
                      id="crea_responsavel_tecnico"
                      name="crea_responsavel_tecnico"
                      value={newCertificado?.crea_responsavel_tecnico}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_certificado">
                      Codigo do Certificado
                    </Label>
                    <Input
                      id="codigo_certificado"
                      name="codigo_certificado"
                      value={newCertificado?.codigo_certificado}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <SelectMap
                      onChange={(value) =>
                        setNewCertificado((prev) => ({
                          ...prev,
                          instrutor: { id: value },
                        }))
                      }
                      label="Instrutores"
                      input_name="instrutor"
                      itens={instrutores}
                      placeholder="Selecione os Instrutores"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="local_treinamento">Local de Emissão</Label>
                    <Input
                      id="local_treinamento"
                      name="local_treinamento"
                      placeholder="Ex: TRÊS LAGOAS/ MS"
                      value={newCertificado?.local_treinamento}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-3 justify-end">
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
                      <DropdownMenuContent className="w-56">
                        {participantes.map((participante) => (
                          <DropdownMenuCheckboxItem
                            key={participante.id}
                            checked={newCertificado.participantes.some(
                              (p) => p.id === participante.id
                            )}
                            onCheckedChange={(isChecked) =>
                              handleParticipante(isChecked, participante)
                            }
                          >
                            {participante.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    {certificado.createdAt.split("T")[0].split("-").reverse().join("/")}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                    >
                      <BookUp2 className="" />
                      Baixar zip
                    </Button>
                    <Button
                      variant={"outline"}
                      className="p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                    >
                      <List className="" />
                      Listagem
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
