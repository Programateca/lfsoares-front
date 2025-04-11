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
  eventos: Evento[] | any[];
}

export function SelectMap({
  itens,
  placeholder,
  input_name,
  label,
  onChange,
  eventos,
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
              const eventoFiltrado = eventos.find(
                (evento) => evento.id === identificadorParsed.evento_id
              );
              return (
                <SelectItem key={item.id} value={item.id}>
                  Identificador {item.code} ={" "}
                  {eventoFiltrado ? ` ${eventoFiltrado.titulo}` : item.nome}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
