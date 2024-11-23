import { Button } from "./ui/button";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import expressionParser from "docxtemplater/expressions";

import { api } from "@/lib/axios";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  CircleX,
  Edit,
  Loader2,
  Plus,
  RotateCcw,
  // Search,
  Trash2Icon,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Evento } from "@/@types/Evento";
import { Participante } from "@/@types/Participante";

const Certificados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [certificadosGerados, setCertificadosGerados] = useState<any[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  console.log(participantes);
  const [newCertificado, setNewCertificado] = useState({
    evento: {
      id: "",
    },
    pessoas: [],
    emissaoData: "",
    local: "",
  });

  function loadFile(url: string, callback: any) {
    PizZipUtils.getBinaryContent(url, callback);
  }

  const generateDocument = (data: Record<string, string>) => {
    loadFile(
      "/templates/certificado-frente-verso.pptx",
      (error: Error, content: any) => {
        if (error) {
          throw error;
        }
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          delimiters: { start: "[", end: "e]" },
          paragraphLoop: true,
          linebreaks: true,
          parser: expressionParser,
        });
        doc.render({
          nome_treinamento: "Treinamento de Segurança",
          carga_hora: "8",
          cpf: "123456789",
          cnpj: "123456789",
          e_dia: "01",
          e_mes: "01",
          empresa: "Empresa",
          nome_participante: "Fulano de Tal",
          portaria_treinamento: "123",
          r_dia: "01",
          r_hora: "08",
          r_hora_fim: "17",
          r_mes: "01",
        });
        const out = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }); //Output the document using Data-URI
        saveAs(out, "output.pptx");
      }
    );
  };

  const fetchData = async () => {
    try {
      const response = await api.get("documentos");
      const eventosResp = await api.get("eventos");
      const pessoasResp = await api.get("pessoas");

      setParticipantes(pessoasResp.data.data);
      setCertificadosGerados(response.data.data);
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

    // r = realizado
    // e = emissão
    const schema = {
      // Frente
      nome_participante: participantes[0].name,
      portaria_treinamento: "123",
      // nome_treinamento:
      // cnpj:
      // r_dia:
      // r_mes:
      // r_hora:
      // r_minutos:
      // carga_hora:
      // e_dia:
      // e_mes:
      // codigo:
      // // Verso
      // nome_treinamento:
      // nome_instrutor:
      // matricula_instrutor:
      // formacao_instrutor:
      // descricao:
      // tipo_formacao:
      // carga_h:
      // nome_responsavel_tecnico:
      // formacao_responsavel_tecnico:
      // crea_responsavel_tecnico:
    };
  };

  const resetForm = () => {
    setNewCertificado({
      evento: {
        id: "",
      },
      pessoas: [],
      emissaoData: "",
      local: "",
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
                <Plus className="mr-2 h-4 w-4" /> Gerar novo Certificado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Geração de certificado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Evento</Label>
                    <Select
                      onValueChange={(value) => {
                        setNewCertificado((prev) => ({
                          ...prev,
                          evento: {
                            id: value,
                          },
                        }));
                      }}
                      value={newCertificado.evento.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup className="text-start">
                          <SelectLabel>Evento:</SelectLabel>
                          {eventos.map((evento) => {
                            return (
                              <SelectItem key={evento.id} value={evento.id}>
                                {evento.treinamento.name}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Participantes</Label>
                    <Select
                      onValueChange={(value) => {
                        setNewCertificado((prev) => ({
                          ...prev,
                          pessoas: [],
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione os participantes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup className="text-start">
                          <SelectLabel>Participantes:</SelectLabel>
                          {participantes.map((participante) => {
                            return (
                              <SelectItem
                                key={participante.id}
                                value={participante.id}
                              >
                                {participante.name}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentData">Data de emissão</Label>
                    <Input
                      id="documentData"
                      name="documentData"
                      type="date"
                      value={newCertificado.emissaoData}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="local">Local de emissão</Label>
                    <Input
                      id="local"
                      name="local"
                      type="text"
                      placeholder="Ex: TRÊS LAGOAS/ MS"
                      value={newCertificado.local}
                      onChange={handleInputChange}
                      required
                    />
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
                  <TableCell className="font-medium py-2">
                    {certificado.modelType}
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
