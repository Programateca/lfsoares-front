import { Evento } from "@/@types/Evento";
import { Empresa } from "@/@types/Empresa";

import { Label } from "./ui/label";
import {
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select,
  SelectContent,
} from "./ui/select";
import { Instrutor } from "@/@types/Instrutor";

interface SelectMapProps {
  placeholder: string;
  itens: Evento[] | Empresa[] | Instrutor[];
  input_name: string;
  label: string;
  onChange: (value: string) => void;
}

export function SelectMap({ itens, placeholder, input_name, label, onChange }: SelectMapProps) {
  return (
    <>
      <Label htmlFor={input_name}>{label}</Label>
      <Select onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className="text-start">
            {itens.map((item) => {
              return (
                <SelectItem key={item.id} value={item.id}>
                  {"treinamento" in item ? item.treinamento.name : item.name}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
