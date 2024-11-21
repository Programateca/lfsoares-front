import { Button } from "./ui/button";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import expressionParser from "docxtemplater/expressions";

import { api } from "@/lib/axios";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "./ui/dialog";

import { CertificadoModal } from "./CertificadoModal";

export enum TipoDeDocumento {
  CERTIFICADO = "certificado",
  CERTIFICADO_PONTE = "certificado-ponte",
  // TODO Listas vão ser geradas no componente de listas
  // LISTA_DIA_TODO = 'lista-dia-todo',
  // LISTA_MEIO_PERIODO = 'lista-meio-periodo',
}

interface CertificadoDb {
  expiryDate: string;
  modelType: TipoDeDocumento;
  documentData: string;
}

const Certificado = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [certificadosGerados, setCertificadosGerados] = useState<any[]>([]);

  // Função usada dentro do gerarDocumento
  function loadFile(url: string, callback: any) {
    PizZipUtils.getBinaryContent(url, callback);
  }

  // TODO Essa função gera o documento igual o exemplo que mandei no whatsapp
  // TODO Refatorar para receber criar o certificado atraves de parametros dinamicos
  const gerarDocumento = () => {
    loadFile(
      "/templates/certificado-frente.pptx",
      (error: Error, content: any) => {
        if (error) {
          throw error;
        }
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          delimiters: { start: "[", end: "]" },
          paragraphLoop: true,
          linebreaks: true,
          parser: expressionParser,
        });
        doc.render({
          nome_treinamento: "Treinamento de Segurança",
          carga_hora: "8",
          cnpj: "123456789",
          e_dia: "01",
          e_mes: "01",
          empresa: "Empresa",
          nome_participante: "Fulano de Tal",
          portaria_treinamento: "123",
          r_dia: "01",
          r_hora: "08",
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

  // TODO Exemplo de como salvar um certificado no banco de dados
  const saveCertificadoInDb = async (data: CertificadoDb) => {
    // const dataString = JSON.stringify(data);
    // const response = await api.post("documentos", {
    //   expiryDate: "string",
    //   modelType: "certificado",
    //   documentData: dataString,
    // });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Gerar Certificados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Gerar Novo Certificado
              </Button>
            </DialogTrigger>
            <CertificadoModal handleSubmit={handleSubmit} />
          </Dialog>
        </div>
        {/* <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
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
                <TableRow
                  key={certificado.id}
                  className={certificado.status.id !== 1 ? "line-through" : ""}
                >
                  <TableCell className="font-medium py-2">
                    {certificado.name}
                  </TableCell>
                  <TableCell className="py-2">{certificado.email}</TableCell>
                  <TableCell className="py-2">
                    {certificado.status.id !== 2 ? "Ativo" : "Inativo"}
                  </TableCell>
                  <TableCell className="py-2 text-end">
                    <Button
                      variant={"outline"}
                      className={`mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200
                      `}
                      disabled={certificado.status.id !== 1}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {certificado.status.id !== 2 ? (
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <Button
                            variant={"outline"}
                            className="p-2 h-fit hover:bg-red-100 hover:border-red-200"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Tem certeza que deseja inativar este usuário?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Está ação podera ser revertida posteriormente. Mas
                              o usuário não poderá acessar o sistema enquanto
                              estiver inativo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="w-20">
                              Não
                            </AlertDialogCancel>
                            <AlertDialogAction className="w-20">
                              Sim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant={"outline"}
                        className="p-2 h-fit hover:bg-gray-200 hover:border-gray-300"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table> */}
      </CardContent>
      <div>
        <Button onClick={gerarDocumento}>GERAR CERTIFICADO TESTE</Button>
      </div>
    </Card>
  );
};

export default Certificado;
