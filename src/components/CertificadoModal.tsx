import { Button } from "./ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface CertificadoModalProps {
  handleSubmit: (e: React.FormEvent) => void;
}

export function CertificadoModal({ handleSubmit }: CertificadoModalProps) {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Gerar Certificado</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instrutor">Selecione o Modelo</Label>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um instrutor" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={"certificado"}>Certificado</SelectItem>
                <SelectItem value={"certificado-ponte"}>
                  Certificado Ponte
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Campo</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Campo</Label>
          <Input id="password" name="password" type="password" />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit">Adicionar</Button>
        </div>
      </form>
    </DialogContent>
  );
}
