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
  itens: Evento[] | Empresa[] | Instrutor[] | any[];
  input_name: string;
  label: string;
  onChange: (value: string) => void;
}

export function SelectMap({
  itens,
  placeholder,
  input_name,
  label,
  onChange,
}: SelectMapProps) {
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
              const identificadorParsed = item.identificadorData
                ? JSON.parse(item.identificadorData)
                : null;
              return (
                <SelectItem key={item.id} value={item.id}>
                  Identificador {item.code} ={" "}
                  {identificadorParsed?.treinamento || item.name}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
