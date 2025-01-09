import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Plus,
  Edit,
  CircleX,
  Trash2Icon,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";
import { Empresa } from "@/@types/Empresa";
// import { Instrutor } from "@/@types/Instrutor";
import { Treinamento } from "@/@types/Treinamento";
import { Evento } from "@/@types/Evento";

const Eventos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventoInEditMode, seteventoInEditMode] = useState<string | number>("");
  const [newEvento, setNewEvento] = useState({
    empresa: "",
    treinamento: "",
    courseLocation1: "",
    courseLocation2: "",
    courseDate: "",
    completionDate: "",
    courseTime: "",
    courseInterval: "",
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);

  const fetchEventos = async () => {
    try {
      const response = await api.get("eventos");
      setEventos(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchEventos();
      const empresaResp = await api.get("empresas");
      const treinamentoResp = await api.get("treinamentos");
      setEmpresas(empresaResp.data.data);
      setTreinamentos(treinamentoResp.data.data);
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const resetEventoState = () => {
    setNewEvento({
      empresa: "",
      treinamento: "",
      courseLocation1: "",
      courseLocation2: "",
      courseDate: "",
      completionDate: "",
      courseTime: "",
      courseInterval: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvento((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (eventoInEditMode) {
      try {
        await api.patch(`eventos/${eventoInEditMode}`, {
          ...newEvento,
        });

        fetchEventos();
        setIsModalOpen(false);
        resetEventoState();
      } catch (error) {}
      return;
    }

    try {
      await api.post("Eventos", {
        ...newEvento,
      });

      fetchEventos();
      setIsModalOpen(false);
      resetEventoState();
    } catch (error) {}
  };

  const handleEdit = (id: string) => {
    seteventoInEditMode(id);
    setIsModalOpen(true);

    const evento = eventos.find((evento) => evento.id === id);

    if (evento) {
      setNewEvento({
        empresa: evento.empresa.id,
        treinamento: evento.treinamento.id,
        courseLocation1: evento.courseLocation1,
        courseLocation2: evento.courseLocation2,
        courseDate: evento.courseDate,
        completionDate: evento.completionDate,
        courseTime: evento.courseTime,
        courseInterval: evento.courseInterval,
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      await api.patch(`Eventos/${id}`, {
        status: {
          id: status,
        },
      });

      fetchEventos();
    } catch (error) {}
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                resetEventoState();
                seteventoInEditMode("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Eventos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] lg:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>
                  {eventoInEditMode ? "Editar" : "Adicionar"} Evento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 ">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Contratante</Label>
                      <Select
                        onValueChange={(value) => {
                          setNewEvento((prev) => ({
                            ...prev,
                            empresa: value,
                          }));
                        }}
                        value={newEvento.empresa}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Empresa:</SelectLabel>
                            {empresas.map((empresa) => {
                              return (
                                <SelectItem key={empresa.id} value={empresa.id}>
                                  {empresa.name}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treinamento">Treinamento</Label>
                      <Select
                        onValueChange={(value) => {
                          setNewEvento((prev) => ({
                            ...prev,
                            treinamento: value,
                          }));
                        }}
                        value={newEvento.treinamento}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um treinamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Treinamento:</SelectLabel>
                            {treinamentos.map((treinamento) => {
                              return (
                                <SelectItem
                                  key={treinamento.id}
                                  value={treinamento.id}
                                >
                                  {treinamento.name}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseLocation1">
                        Local de treinamento 1
                      </Label>
                      <Input
                        id="courseLocation1"
                        name="courseLocation1"
                        value={newEvento.courseLocation1}
                        onChange={handleInputChange}
                        required={eventoInEditMode ? false : true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseLocation2">
                        Local de treinamento 2
                      </Label>
                      <Input
                        className="border-dashed text-center"
                        id="courseLocation2"
                        name="courseLocation2"
                        placeholder="Clique para adicionar"
                        value={newEvento.courseLocation2}
                        onChange={handleInputChange}
                        required={eventoInEditMode ? false : true}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="courseDate">Data</Label>
                      <Input
                        id="courseDate"
                        name="courseDate"
                        type="date"
                        value={newEvento.courseDate}
                        onChange={handleInputChange}
                        required={eventoInEditMode ? false : true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="completionDate">Data de conclusão</Label>
                      <Input
                        id="completionDate"
                        name="completionDate"
                        type="date"
                        value={newEvento.completionDate}
                        onChange={handleInputChange}
                        required={eventoInEditMode ? false : true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseTime">Horário</Label>
                      <div className="flex items-center space-x-2 max-sm:flex-wrap max-sm:space-x-0 max-sm:gap-3 max-sm:justify-center">
                        <Input
                          type="time"
                          placeholder="Início"
                          onChange={(e) => {
                            const startTime = e.target.value;
                            const endTime =
                              newEvento.courseTime.split(" ÀS ")[1] || "";
                            setNewEvento((prev) => ({
                              ...prev,
                              courseTime: `${startTime} ÀS ${endTime}`,
                            }));
                          }}
                          value={newEvento.courseTime.split(" ÀS ")[0] || ""}
                        />
                        <span>ÀS</span>
                        <Input
                          type="time"
                          placeholder="Fim"
                          onChange={(e) => {
                            const startTime =
                              newEvento.courseTime.split(" ÀS ")[0] || "";
                            const endTime = e.target.value;
                            setNewEvento((prev) => ({
                              ...prev,
                              courseTime: `${startTime} ÀS ${endTime}`,
                            }));
                          }}
                          value={newEvento.courseTime.split(" ÀS ")[1] || ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseTime">Intervalo</Label>
                      <div className="flex items-center space-x-2 max-sm:flex-wrap max-sm:space-x-0 max-sm:gap-3 max-sm:justify-center">
                        <Input
                          type="time"
                          placeholder="Início"
                          onChange={(e) => {
                            const startTime = e.target.value;
                            const endTime =
                              newEvento.courseTime.split(" ÀS ")[1] || "";
                            setNewEvento((prev) => ({
                              ...prev,
                              courseTime: `${startTime} ÀS ${endTime}`,
                            }));
                          }}
                          value={newEvento.courseTime.split(" ÀS ")[0] || ""}
                        />
                        <span>ÀS</span>
                        <Input
                          type="time"
                          placeholder="Fim"
                          onChange={(e) => {
                            const startTime =
                              newEvento.courseTime.split(" ÀS ")[0] || "";
                            const endTime = e.target.value;
                            setNewEvento((prev) => ({
                              ...prev,
                              courseTime: `${startTime} ÀS ${endTime}`,
                            }));
                          }}
                          value={newEvento.courseTime.split(" ÀS ")[1] || ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Contrante </TableHead>
              <TableHead>Datas</TableHead>
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
            ) : eventos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhum evento encontrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              eventos.map((evento) => (
                <TableRow
                  key={evento.id}
                  className={evento.status.id !== 1 ? "line-through" : ""}
                >
                  <TableCell
                    className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                  >
                    {evento.treinamento.name}
                  </TableCell>
                  <TableCell className="py-2">{evento.empresa.name}</TableCell>
                  <TableCell className="py-2">
                    {new Date(evento.courseDate).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(evento.completionDate).toLocaleDateString(
                      "pt-BR"
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    {evento.status.id !== 2 ? "Ativo" : "Inativo"}
                  </TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      onClick={() => handleEdit(evento.id)}
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                      disabled={evento.status.id !== 1}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {evento.status.id === 1 ? (
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
                              Tem certeza que deseja inativar este evento?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Está ação podera ser revertida posteriormente. Mas
                              o evento não podera ser utilizada enquanto estiver
                              inativa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="w-20">
                              Não
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="w-20"
                              onClick={() => handleUpdateStatus(evento.id, 2)}
                            >
                              Sim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        onClick={() => handleUpdateStatus(evento.id, 1)}
                        variant={"outline"}
                        className="p-2 h-fit hover:bg-green-100 hover:border-green-200"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
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

export default Eventos;
