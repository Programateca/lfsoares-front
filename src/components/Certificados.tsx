import { z } from "zod";

import { Button } from "./ui/button";

import { api } from "@/lib/axios";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { CircleX, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

import { Evento } from "@/@types/Evento";
import { Pessoa } from "@/@types/Pessoa";
import { SelectMap } from "./SelectMap";
import { Instrutor } from "@/@types/Instrutor";
import { AppError } from "@/utils/AppError";
import { Empresa } from "@/@types/Empresa";
import { Checkbox } from "./ui/checkbox";

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
  r_dia: "",
  r_mes: "",
  r_hora: "",
  r_minutos: "",
  carga_hora: "",
  emissao_data: "",
  codigo: "",
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

  const [newCertificado, setNewCertificado] = useState<NewCertificado>(defaultValues);

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
    const selectedEmpresa = empresas.find((empresa) => empresa.id === newCertificado?.empresa?.id);
    const selectedEvento = eventos.find((evento) => evento.id === newCertificado?.evento?.id);
    const selectedInstrutor = instrutores.find(
      (instrutor) => instrutor.id === newCertificado?.instrutor?.id
    );

    if (!selectedParticipantes.length) throw new AppError("Selecione um participante", 404); // TODO
    if (!selectedEmpresa) throw new AppError("Empresa não encontrado", 404);
    if (!selectedEvento) throw new AppError("Evento não encontrado", 404);
    if (!selectedInstrutor) throw new AppError("Instrutor não encontrado", 404);

    // const User = z.object({
    //   username: z.string(),
    // });

    // r = realizado
    // e = emissão
    const dataRealizada = newCertificado.emissao_data.split("-");

    console.log(selectedInstrutor);
    const schema = {
      // Dois lados
      carga_hora: selectedEvento.treinamento.courseHours,
      // Frente
      nome_participante: "Vitor Teste",
      portaria_treinamento: "Portaria Teste",
      nome_treinamento: selectedEvento.treinamento.name,
      cnpj: selectedEmpresa.cnpj,
      r_dia: dataRealizada[2], // Dia de Realização
      r_mes: dataRealizada[1], // Mes de Realização
      r_hora: "", // Hora de Realização
      r_minutos: "", // Minutos de Realização
      e_dia: "", // Dia de Emissão
      e_mes: "", // Mes de Emissão
      codigo: "",
      // Verso
      nome_instrutor: selectedInstrutor.name,
      matricula_instrutor: selectedInstrutor.matricula,
      formacao_instrutor: selectedInstrutor.qualificacaoProfissional,
      descricao: selectedEvento.treinamento.description,
      tipo_formacao: selectedEvento.treinamento.courseType,
      nome_responsavel_tecnico: "",
      formacao_responsavel_tecnico: "",
      crea_responsavel_tecnico: "",
      local_treinamento: selectedEvento.courseLocation,
      contratante: selectedEmpresa.name,
    };
  };

  const handleParticipante = (isChecked: boolean | string, participante: Pessoa) => {
    if (isChecked) {
      setNewCertificado((prev) => ({
        ...prev,
        participantes: [...prev.participantes, { id: participante.id }],
      }));
    } else {
      setNewCertificado((prev) => ({
        ...prev,
        participantes: prev.participantes.filter((p) => p.id !== participante.id),
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4 grid grid-cols-3 gap-4 max-h-[80vh]">
                  <div className="space-y-2 col-span-2">
                    <SelectMap
                      input_name="evento"
                      itens={eventos ?? []}
                      label="Evento"
                      placeholder="Selecione o Evento"
                      onChange={(value) =>
                        setNewCertificado((prev) => ({ ...prev, evento: { id: value } }))
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
                        setNewCertificado((prev) => ({ ...prev, empresa: { id: value } }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emissao_data">Data de Emissão</Label>
                    <Input
                      id="emissao_data"
                      name="emissao_data"
                      type="date"
                      value={newCertificado?.emissao_data}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_responsavel_tecnico">Nome do Responsável Técnico</Label>
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
                    <Label htmlFor="crea_responsavel_tecnico">Crea do Responsável Técnico</Label>
                    <Input
                      id="crea_responsavel_tecnico"
                      name="crea_responsavel_tecnico"
                      value={newCertificado?.crea_responsavel_tecnico}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <SelectMap
                      onChange={(value) =>
                        setNewCertificado((prev) => ({ ...prev, instrutor: { id: value } }))
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

                  <div className="flex flex-col">
                    {participantes.map((participante) => (
                      <div key={participante.id} className="flex items-center space-x-2">
                        <Checkbox
                          onCheckedChange={(checked) => handleParticipante(checked, participante)}
                        />
                        <label
                          htmlFor={participante.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {participante.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
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
                  <TableCell className="font-medium py-2">{certificado.modelType}</TableCell>
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
