import { useForm } from "react-hook-form";
import { Button } from "./ui/button";

import { api } from "@/lib/axios";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { CircleX, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const Certificados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  const schema = {
    nome_treinamento: "",
  };

  //   const fetchData = async () => {
  //     try {
  //       const response = await api.get("documentos");
  //       const eventosResp = await api.get("eventos");
  //       const pessoasResp = await api.get("pessoas");
  //       const instrutoresResp = await api.get("instrutores");
  //       const empresasResp = await api.get("empresas");

  //       // console.log(empresasResp.data);

  //       setEmpresas(empresasResp.data.data);
  //       setParticipantes(pessoasResp.data.data);
  //       setCertificadosGerados(response.data.data);
  //       setInstrutores(instrutoresResp.data.data);
  //       setEventos(eventosResp.data.data);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   useEffect(() => {
  //     const inicializarFetch = async () => {
  //       setLoading(true);
  //       await fetchData();
  //       setLoading(false);
  //     };

  //     inicializarFetch();
  //   }, []);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Certificados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)}>
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Gerar Nova Lista de Presença
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Lista de Presença</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"></form>
            </DialogContent>
          </Dialog>
        </div>
        {/* <Table>
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
        </Table> */}
      </CardContent>
    </Card>
  );
};

export default Certificados;
