/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { api } from "@/lib/axios";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  BookUp2,
  CircleX,
  Loader2,
  Plus,
  RotateCcw,
  Trash2Icon,
} from "lucide-react";
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
import { gerarLista } from "@/utils/gerar-lista";
import { Label } from "./ui/label";
import { SelectMap } from "./SelectMap";
import { IdentificadorData } from "@/@types/IdentificadorData";
import toast from "react-hot-toast";
import { ListaData } from "@/@types/ListaData";
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
import { Evento } from "@/@types/Evento";

export interface ListaFormData {
  documento_identificador: string;
  tipo_lista: string;
  cidade: string;
}

const ListaPresenca = () => {
  const [identificadores, setIdentificadores] = useState<IdentificadorData[]>(
    []
  );
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const { control, handleSubmit, reset, setValue } = useForm<ListaFormData>();

  // Estados para paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  // Estados para busca e ordenação
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState<{
    id: string | number;
    status: number;
  } | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [showInativos, setShowInativos] = useState(false);

  const onSubmit = async (data: ListaFormData) => {
    const identificadorSelecionado = data.documento_identificador;
    const identificadorValido = identificadores.find(
      (doc) => doc.id === identificadorSelecionado
    );
    if (identificadorValido) {
      const dataIdentificador = JSON.parse(
        identificadorValido.identificadorData
      ) as ListaData;
      const empresaCNPJ = empresas.find(
        (empresa) => empresa.id === dataIdentificador.empresa_id
      ).cnpj;

      const eventoIdentificador = dataIdentificador.evento_id;

      const selectedEvento = eventos.find(
        (evento) => evento.id === eventoIdentificador
      );

      const titulo = dataIdentificador.assinante_titulo2.split(":")[0].trim();
      // return;
      const schema: Record<string, any> = {
        datasObject: dataIdentificador.instrutorDates,
        nome_treinamento: dataIdentificador.treinamento,
        tipo: dataIdentificador.tipo,
        carga_horaria: `${dataIdentificador.carga_horaria}`,
        datas: dataIdentificador.datas,
        horario: dataIdentificador.horarios,
        intervalo: dataIdentificador.intervalo,
        modulo: dataIdentificador.modulo,
        endereco: selectedEvento?.courseLocation2
          ? `${selectedEvento.courseLocation} | ${selectedEvento.courseLocation2}`
          : selectedEvento?.courseLocation || "",
        instrutor:
          titulo.toLocaleLowerCase() === "instrutor"
            ? `${dataIdentificador.assinante1} | ${dataIdentificador.assinante2}`
            : dataIdentificador.assinante1,
        cidade: data.cidade,
        nome_empresa: dataIdentificador.empresa,
        cnpj: empresaCNPJ,
      };

      const pessoas: { id: string; name: string }[] = [];
      for (let i = 1; i <= 60; i++) {
        // @ts-ignore
        const pessoaId = dataIdentificador[`p_id${i}`];
        // @ts-ignore
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

      const newLista = {
        year: new Date().getFullYear().toString(),
        modelType: data.tipo_lista,
        documentData: JSON.stringify({
          ...schema,
          numberOfParticipantes: participantes.length,
          tipo_lista: data.tipo_lista,
        }),
      };

      // FOR DEBUG
      // const listaData = JSON.parse(newLista.documentData);
      // console.log("LISTA DATA", listaData);
      // gerarLista({ listaData });
      // return;
      // ----

      const result = await api.post("documentos", newLista).catch((error) => {
        console.error(error);
        toast.error("Erro ao gerar lista de presença");
      });

      if (result && result.status === 201) {
        toast.success("Lista de presença gerada com sucesso");
      }
      fetchData();
      setIsModalOpen(false);
    } else {
      toast.error("Identificador inválido");
    }
  };

  const fetchData = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      const documentosResp = await api.get(
        "documentos/lista-dia-todo,lista-meio-periodo",
        { params: { page: pageNumber, limit } }
      );
      const identificadoresResp = await api.get("identificadores", {
        params: { limit: 100000 },
      });
      const eventosResp = await api.get("eventos", {
        params: { limit: 100000 },
      });
      const response = await api.get("empresas", { params: { limit: 100000 } });
      setEmpresas(response.data.data);
      setIdentificadores(
        identificadoresResp.data.data.filter((e: any) => e.status.id === 1) ||
          []
      );
      setDocumentos(documentosResp.data.data);
      setEventos(eventosResp.data.data);
      setHasNextPage(documentosResp.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar documentos");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage > page && !hasNextPage) {
      toast.error("Não há registros para esta página.");
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(
        "documentos/lista-dia-todo,lista-meio-periodo",
        { params: { page: newPage, limit } }
      );
      setDocumentos(response.data.data);
      setPage(newPage);
      setHasNextPage(response.data.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  // Inicializa os dados
  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleInputChange = (name: string, value: string) => {
    setValue(name as keyof ListaFormData, value);
  };

  const handleDownload = async (documentoId: string) => {
    const documentoFiltrado = documentos.find(
      (documento: { id: string }) => documento.id === documentoId
    );
    const data = JSON.parse(documentoFiltrado.documentData);
    gerarLista({ listaData: data });
  };

  // Função de ordenação
  const handleSort = (column: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === column) {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Filtra e ordena os documentos com base na busca e no cabeçalho clicado
  const filteredDocuments = documentos.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.modelType.toLowerCase().includes(query) ||
      doc.createdAt.toLowerCase().includes(query)
    );
  });

  const sortedDocuments = filteredDocuments.slice().sort((a, b) => {
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
        toast("Lista de presença ativada!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Lista de presença desativada!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchData();
    } catch (error) {}
  };

  const filteredData = showInativos
    ? sortedDocuments.filter((p) => p.status?.id === 2)
    : sortedDocuments.filter((p) => p.status?.id === 1);

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
                    label="Selecione um dos identificadores de participantes abaixo:"
                    placeholder="Selecione um documento"
                    onChange={(e) =>
                      handleInputChange("documento_identificador", e)
                    }
                    eventos={eventos}
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
                        <Label className="text-sm font-medium">Cidade</Label>
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
            placeholder="Buscar lista de presença..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
              <TableHead>Tipo de lista</TableHead>
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
                <TableCell colSpan={4} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loader"></div>
                    <Loader2 className="text-lg mr-2 animate-spin text-gray-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      As listas de presença ainda não foram geradas
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((documento) => (
                <TableRow key={documento.id}>
                  <TableCell className="font-medium max-w-[20rem] overflow-hidden whitespace-nowrap overflow-ellipsis py-2">
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
                      <BookUp2 className="h-4 w-4" />
                      Baixar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="p-2 h-fit hover:bg-red-100 hover:border-red-200"
                          onClick={() =>
                            setSelectedItem({
                              id: documento.id,
                              status: documento.status.id === 1 ? 2 : 1,
                            })
                          }
                        >
                          {documento.status.id === 1 ? (
                            <Trash2Icon className="h-4 w-4" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {documento.status.id === 1
                              ? "Inativar lista de presença?"
                              : "Reativar lista de presença?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {documento.status.id === 1
                              ? "Tem certeza que deseja inativar esta lista de presença?"
                              : "Tem certeza que deseja reativar esta lista de presença?"}
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
                                  selectedItem.status
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
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => handlePageChange(1)}
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
      </CardContent>
    </Card>
  );
};

export default ListaPresenca;
