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
  Search,
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

interface Status {
  id: number;
  name: string;
}

interface Instrutor {
  status: Status;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface Treinamento {
  status: Status;
  courseModality: string;
  courseType: string;
  description: string;
  courseValidaty: string;
  courseHours: string;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface Empresa {
  status: Status;
  cnpj: string;
  name: string;
  endereco: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface Evento {
  status: Status;
  empresa: Empresa;
  instrutor: Instrutor;
  treinamento: Treinamento;
  courseLocation: string;
  responsavelTecnico: string;
  completionDate: string;
  courseTime: string;
  courseDate: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

const Eventos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventoInEditMode, seteventoInEditMode] = useState<string | number>("");
  const [newEvento, setNewEvento] = useState({
    status: {
      id: 1,
      name: "",
    },
    instrutor: {
      status: {
        name: "",
      },
      id: "",
      name: "",
      createdAt: "",
      updatedAt: "",
    },
    treinamento: {
      status: {
        name: "",
      },
      id: "",
      courseModality: "",
      courseType: "",
      description: "",
      courseValidaty: "",
      courseHours: "",
      name: "",
      createdAt: "",
      updatedAt: "",
    },
    empresa: {
      id: "",
      cnpj: "",
      name: "",
      endereco: "",
      createdAt: "",
      updatedAt: "",
      status: {
        name: "",
      },
    },
    courseLocation: "",
    responsavelTecnico: "",
    completionDate: "",
    courseTime: "",
    courseDate: "",
    createdAt: "",
    updatedAt: "",
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
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
      const instrutorResp = await api.get("instrutores");
      const treinamentoResp = await api.get("treinamentos");
      setEmpresas(empresaResp.data.data);
      setInstrutores(instrutorResp.data.data);
      setTreinamentos(treinamentoResp.data.data);
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  useEffect(() => {
    if (newEvento.treinamento.id) {
      const treinamentoSelecionado = treinamentos.find(
        (treinamento) => treinamento.id === newEvento.treinamento.id
      );

      if (treinamentoSelecionado) {
        setNewEvento((prev) => ({
          ...prev,
          treinamento: {
            ...prev.treinamento,
            courseType: treinamentoSelecionado.courseType,
            courseHours: treinamentoSelecionado.courseHours,
            courseModality: treinamentoSelecionado.courseModality,
          },
        }));
      }
    }
  }, [newEvento.treinamento.id, treinamentos]);

  const resetEventoState = () => {
    setNewEvento({
      status: {
        id: 1,
        name: "",
      },
      instrutor: {
        status: {
          name: "",
        },
        id: "",
        name: "",
        createdAt: "",
        updatedAt: "",
      },
      treinamento: {
        status: {
          name: "",
        },
        id: "",
        courseModality: "",
        courseType: "",
        description: "",
        courseValidaty: "",
        courseHours: "",
        name: "",
        createdAt: "",
        updatedAt: "",
      },
      empresa: {
        status: {
          name: "",
        },
        id: "",
        cnpj: "",
        name: "",
        endereco: "",
        createdAt: "",
        updatedAt: "",
      },
      courseLocation: "",
      responsavelTecnico: "",
      completionDate: "",
      courseTime: "",
      courseDate: "",
      createdAt: "",
      updatedAt: "",
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
        courseLocation: newEvento.courseLocation,
        responsavelTecnico: newEvento.responsavelTecnico,
        completionDate: newEvento.completionDate,
        courseTime: newEvento.courseTime,
        courseDate: newEvento.courseDate,
        instrutor: {
          id: newEvento.instrutor.id,
        },
        empresa: {
          id: newEvento.empresa.id,
        },
        treinamento: {
          id: newEvento.treinamento.id,
        },
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
        status: evento.status,
        treinamento: {
          status: evento.treinamento.status,
          id: evento.treinamento.id,
          courseModality: evento.treinamento.courseModality,
          courseType: evento.treinamento.courseType,
          description: evento.treinamento.description,
          courseValidaty: evento.treinamento.courseValidaty,
          courseHours: evento.treinamento.courseHours,
          name: evento.treinamento.name,
          createdAt: evento.treinamento.createdAt,
          updatedAt: evento.treinamento.updatedAt,
        },
        instrutor: {
          status: evento.instrutor.status,
          id: evento.instrutor.id,
          name: evento.instrutor.name,
          createdAt: evento.instrutor.createdAt,
          updatedAt: evento.instrutor.updatedAt,
        },
        empresa: {
          status: evento.empresa.status,
          id: evento.empresa.id,
          cnpj: evento.empresa.cnpj,
          name: evento.empresa.name,
          endereco: evento.empresa.endereco,
          createdAt: evento.empresa.createdAt,
          updatedAt: evento.empresa.updatedAt,
        },
        courseLocation: evento.courseLocation,
        responsavelTecnico: evento.responsavelTecnico,
        completionDate: evento.completionDate,
        courseTime: evento.courseTime,
        courseDate: evento.courseDate,
        createdAt: evento.createdAt,
        updatedAt: evento.updatedAt,
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
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar Eventos..."
              className="w-64 focus-visible:ring-gray-400"
            />
            <Button
              size="icon"
              variant="ghost"
              className="focus-visible:ring-transparent border-none"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
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
            <DialogContent className="sm:max-w-[555px]">
              <DialogHeader>
                <DialogTitle>Adicionar nova evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 ">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="instrutor">Instrutor</Label>
                      <Select
                        onValueChange={(value) => {
                          setNewEvento((prev) => ({
                            ...prev,
                            instrutor: {
                              ...prev.instrutor,
                              id: value,
                            },
                          }));
                        }}
                        value={newEvento.instrutor.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um instrutor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Instrutor:</SelectLabel>
                            {instrutores.map((instrutor) => {
                              return (
                                <SelectItem
                                  key={instrutor.id}
                                  value={instrutor.id}
                                >
                                  {instrutor.name}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsavelTecnico">
                        Responsável técnico
                      </Label>
                      <Input
                        id="responsavelTecnico"
                        name="responsavelTecnico"
                        value={newEvento.responsavelTecnico}
                        onChange={handleInputChange}
                        required={eventoInEditMode ? false : true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Contratante</Label>
                      <Select
                        onValueChange={(value) => {
                          setNewEvento((prev) => ({
                            ...prev,
                            empresa: {
                              ...prev.empresa,
                              id: value,
                            },
                          }));
                        }}
                        value={newEvento.empresa.id}
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
                      <Label htmlFor="name">Treinamento</Label>
                      <Select
                        onValueChange={(value) => {
                          setNewEvento((prev) => ({
                            ...prev,
                            treinamento: {
                              ...prev.treinamento,
                              id: value,
                            },
                          }));
                        }}
                        value={newEvento.treinamento.id}
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
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="tipoDeTreinamento">
                        Tipo de treinamento
                      </Label>
                      <Input
                        id="tipoDeTreinamento"
                        name="tipoDeTreinamento"
                        value={newEvento.treinamento.courseType}
                        required={eventoInEditMode ? false : true}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseLocation">
                        Local de treinamento
                      </Label>
                      <Input
                        id="courseLocation"
                        name="courseLocation"
                        value={newEvento.courseLocation}
                        onChange={handleInputChange}
                        required={eventoInEditMode ? false : true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseHours">Carga Horária</Label>
                      <Input
                        id="courseHours"
                        name="courseHours"
                        value={newEvento.treinamento.courseHours}
                        required={eventoInEditMode ? false : true}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseModality">Modalidade</Label>
                      <Input
                        id="courseModality"
                        name="courseModality"
                        value={newEvento.treinamento.courseModality}
                        required={eventoInEditMode ? false : true}
                        disabled
                      />
                    </div>
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
                      <Label htmlFor="courseTime">Horário</Label>
                      <Input
                        id="courseTime"
                        name="courseTime"
                        value={newEvento.courseTime}
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
              <TableHead>Responsável</TableHead>
              <TableHead>Instrutor</TableHead>
              <TableHead>Data</TableHead>
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
                  <TableCell className="py-2">
                    {evento.responsavelTecnico}
                  </TableCell>
                  <TableCell className="py-2">
                    {evento.instrutor.name}
                  </TableCell>
                  <TableCell className="py-2">{evento.courseDate}</TableCell>
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
