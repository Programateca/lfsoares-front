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
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";
import toast from "react-hot-toast";

interface Status {
  id: number;
  name: string;
}

interface Empresa {
  id: string;
  name: string;
  cnpj: string;
  endereco: string;
  status: Status;
}

const Empresas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empresaInEditMode, setEmpresaInEditMode] = useState<string | number>(
    ""
  );
  const [newEmpresa, setNewEmpresa] = useState({
    name: "",
    cnpj: "",
    endereco: "",
  });
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const fetchEmpresas = async () => {
    try {
      const response = await api.get("empresas");
      setEmpresas(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    const inicializarFetch = async () => {
      setLoading(true);
      await fetchEmpresas();
      setLoading(false);
    };

    inicializarFetch();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmpresa((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (empresaInEditMode) {
      try {
        await api.patch(`empresas/${empresaInEditMode}`, {
          name: newEmpresa.name,
          cnpj: newEmpresa.cnpj,
          endereco: newEmpresa.endereco,
        });

        fetchEmpresas();
        setIsModalOpen(false);
        toast.success("Empresa atualizada com sucesso!");
        setNewEmpresa({
          name: "",
          cnpj: "",
          endereco: "",
        });
      } catch (error) {}
      return;
    }

    try {
      await api.post("empresas", {
        name: newEmpresa.name,
        cnpj: newEmpresa.cnpj,
        endereco: newEmpresa.endereco,
      });

      fetchEmpresas();
      setIsModalOpen(false);
      toast.success("Empresa cadastrada com sucesso!");
      setNewEmpresa({
        name: "",
        cnpj: "",
        endereco: "",
      });
    } catch (error) {}
  };
  const handleEdit = (id: string) => {
    setEmpresaInEditMode(id);
    setIsModalOpen(true);

    const empresa = empresas.find((empresa) => empresa.id === id);

    if (empresa) {
      setNewEmpresa({
        name: empresa.name,
        cnpj: empresa.cnpj,
        endereco: empresa.endereco,
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      await api.patch(`empresas/${id}`, {
        status: {
          id: status,
        },
      });
      if (status === 1)
        toast("Empresa ativado!", {
          icon: "🚀",
          duration: 2000,
        });
      else
        toast("Empresa inativado!", {
          icon: "🗑️",
          duration: 2000,
        });
      fetchEmpresas();
    } catch (error) {}
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-gray-800">Lista de Empresas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar empresas..."
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
                setNewEmpresa({
                  name: "",
                  cnpj: "",
                  endereco: "",
                });
              setEmpresaInEditMode("");
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Empresas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar nova empresa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newEmpresa.name}
                    onChange={handleInputChange}
                    required={empresaInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    type="cnpj"
                    value={newEmpresa.cnpj}
                    onChange={handleInputChange}
                    required={empresaInEditMode ? false : true}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    type="endereco"
                    value={newEmpresa.endereco}
                    onChange={handleInputChange}
                    required={empresaInEditMode ? false : true}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false),
                        setNewEmpresa({
                          name: "",
                          cnpj: "",
                          endereco: "",
                        });
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
              <TableHead>Nome</TableHead>
              <TableHead>CPNJ</TableHead>
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
            ) : empresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhuma empresa encontrada
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              empresas
                .sort((a, b) => (a.name > b.name ? 1 : -1))
                .map((empresa) => (
                  <TableRow
                    key={empresa.id}
                    className={empresa.status.id !== 1 ? "line-through" : ""}
                  >
                    <TableCell
                      className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                    >
                      {empresa.name}
                    </TableCell>
                    <TableCell className="py-2">
                      {empresa.status.id !== 2 ? "Ativo" : "Inativo"}
                    </TableCell>
                    <TableCell className="py-2">{empresa.cnpj}</TableCell>
                    <TableCell className="text-end py-2">
                      <Button
                        onClick={() => handleEdit(empresa.id)}
                        variant={"outline"}
                        className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                        disabled={empresa.status.id !== 1}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {empresa.status.id === 1 ? (
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
                                Tem certeza que deseja inativar esta empresa?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Está ação podera ser revertida posteriormente.
                                Mas a empresa não podera ser utilizada enquanto
                                estiver inativa.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="w-20">
                                Não
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="w-20"
                                onClick={() =>
                                  handleUpdateStatus(empresa.id, 2)
                                }
                              >
                                Sim
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          onClick={() => handleUpdateStatus(empresa.id, 1)}
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

export default Empresas;
