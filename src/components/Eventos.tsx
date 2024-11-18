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

interface evento {
  status: Status;
  cnpj: string;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface Evento {
  status: Status;
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
  const [eventoInEditMode, seteventoInEditMode] = useState<string | number>("");
  const [newEvento, setNewEvento] = useState({
    status: {
      name: "",
    },
    instrutor: {
      status: {
        name: "",
      },
      name: "",
      createdAt: "",
      updatedAt: "",
    },
    treinamento: {
      status: {
        name: "",
      },
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
      cnpj: "",
      name: "",
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
  const [eventos, setEventos] = useState<Evento[]>([]);

  const fetchEventos = async () => {
    try {
      const response = await api.get("eventos");
      setEventos(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvento((prev) => ({ ...prev, [name]: value }));
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   // if (eventoInEditMode) {
  //   //   try {
  //   //     await api.patch(`eventos/${eventoInEditMode}`, {
       
  //   //     });

  //   //     fetchEventos();
  //   //     setIsModalOpen(false);
  //   //     setNewEvento({
  //   //       name: "",
  //   //       cnpj: "",
  //   //     });
  //   //   } catch (error) {}
  //   //   return;
  //   // }

  //   try {
  //     await api.post("Eventos", {
  //       name: newEvento.name,
  //       cnpj: newEvento.cnpj,
  //     });

  //     fetchEventos();
  //     setIsModalOpen(false);
  //     setNewEvento({});
  //   } catch (error) {}
  // };

  // const handleEdit = (id: string) => {
  //   seteventoInEditMode(id);
  //   setIsModalOpen(true);

  //   const evento = eventos.find((evento) => evento.id === id);

  //   if (evento) {
  //     setNewEvento({});
  //   }
  // };

  // const handleUpdateStatus = async (id: string, status: number) => {
  //   try {
  //     await api.patch(`Eventos/${id}`, {
  //       status: {
  //         id: status,
  //       },
  //     });

  //     fetchEventos();
  //   } catch (error) {}
  // };

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
              if (!open)
                setNewEvento({
                  status: {
                    name: "",
                  },
                  instrutor: {
                    status: {
                      name: "",
                    },
                    name: "",
                    createdAt: "",
                    updatedAt: "",
                  },
                  treinamento: {
                    status: {
                      name: "",
                    },
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
                    cnpj: "",
                    name: "",
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
              seteventoInEditMode("");
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Eventos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar nova evento</DialogTitle>
              </DialogHeader>
              {/* <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={NewEvento.name}
                    onChange={handleInputChange}
                    required={eventoInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    type="cnpj"
                    value={NewEvento.cnpj}
                    onChange={handleInputChange}
                    required={eventoInEditMode ? false : true}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false),
                        setNewEvento({
                          name: "",
                          cnpj: "",
                        });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar</Button>
                </div>
              </form> */}
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              {/* <TableHead>CPNJ</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos &&
              eventos.sort((a, b) => (a.treinamento.name > b.treinamento.name ? 1 : -1)).map(
                (evento) => (
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
                      {evento.status.id !== 2 ? "Ativo" : "Inativo"}
                    </TableCell>
                    {/* <TableCell className="py-2">{evento.cnpj}</TableCell> */}
                    <TableCell className="text-end py-2">
                      <Button
                        // onClick={() => handleEdit(evento.id)}
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
                                Está ação podera ser revertida posteriormente.
                                Mas o evento não podera ser utilizada enquanto
                                estiver inativa.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="w-20">
                                Não
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="w-20"
                                // onClick={() => handleUpdateStatus(evento.id, 2)}
                              >
                                Sim
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          // onClick={() => handleUpdateStatus(evento.id, 1)}
                          variant={"outline"}
                          className="p-2 h-fit hover:bg-green-100 hover:border-green-200"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              )}
            {!Eventos && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-8 w-8 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhum evento encontrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Eventos;
