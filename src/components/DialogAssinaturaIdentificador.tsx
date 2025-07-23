import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface DialogAssinaturaIdentificadorProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handleSubmit: any;
}

export function DialogAssinaturaIdentificador({
  isModalOpen,
  setIsModalOpen,
  handleSubmit,
}: DialogAssinaturaIdentificadorProps) {
  return (
    <Dialog open={isModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white border border-black text-black hover:bg-black hover:text-white">
          <Plus className="mr-2 h-4 w-4" /> Baixar Com Assinatura
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecione a Assinatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assinaturaA">AssinaturaA</Label>
            <select
              id="assinaturaA"
              name="assinaturaA"
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Selecione</option>
              <option value="luiz">Luiz</option>
              <option value="cledione">Cledione</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assinaturaB">AssinaturaB</Label>
            <select
              id="assinaturaB"
              name="assinaturaB"
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Selecione</option>
              <option value="luiz">Luiz</option>
              <option value="cledione">Cledione</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit">Confirmar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
