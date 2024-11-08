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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Label } from "./ui/label";

interface Empresa {
  id: number;
  name: string;
  cnpj: string;
}

const Empresas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [empresaInEditMode, setEmpresaInEditMode] = useState<string | number>(
    ""
  );
  const [newEmpresa, setNewEmpresa] = useState({
    name: "",
    cnpj: "",
  });
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const fetchEmpresas = async () => {
    try {
      const response = await api.get("empresas");
      setEmpresas(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchEmpresas();
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
        });

        fetchEmpresas();
        setIsModalOpen(false);
        setNewEmpresa({
          name: "",
          cnpj: "",
        });
      } catch (error) {}
      return;
    }

    try {
      await api.post("empresas", {
        name: newEmpresa.name,
        cnpj: newEmpresa.cnpj,
      });

      fetchEmpresas();
      setIsModalOpen(false);
      setNewEmpresa({
        name: "",
        cnpj: "",
      });
    } catch (error) {}
  };
  const handleEdit = (id: number) => {
    setEmpresaInEditMode(id);
    setIsModalOpen(true);

    const empresa = empresas.find((empresa) => empresa.id === id);

    if (empresa) {
      setNewEmpresa({
        name: empresa.name,
        cnpj: empresa.cnpj,
      });
    }
  };
  // const handleUpdateStatus = async (id: number, status: number) => {
  //   try {
  //     await api.patch(`users/${id}`, {
  //       status: {
  //         id: status,
  //       },
  //     });

  //     fetchEmpresas();
  //   } catch (error) {}
  // };

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

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false),
                        setNewEmpresa({
                          name: "",
                          cnpj: "",
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
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas
              .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell
                    className="font-medium max-w-[20rem]
                overflow-hidden whitespace-nowrap overflow-ellipsis
                py-2
                "
                  >
                    {empresa.name}
                  </TableCell>
                  <TableCell className="py-2">{empresa.cnpj}</TableCell>
                  <TableCell className="text-end py-2">
                    <Button
                      onClick={() => handleEdit(empresa.id)}
                      variant={"outline"}
                      className="mr-2 p-2 h-fit hover:bg-blue-100 hover:border-blue-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* {empresa.status === 1 ? (
                    <Button
                      variant={"outline"}
                      className="p-2 h-fit hover:bg-red-100 hover:border-red-200"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant={"outline"}
                      className="p-2 h-fit hover:bg-green-100 hover:border-green-200"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )} */}
                  </TableCell>
                </TableRow>
              ))}
            {!empresas && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CircleX className="h-8 w-8 text-red-400" />
                    <p className="text-sm text-red-400">
                      Nenhum usuário encontrado
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

export default Empresas;
