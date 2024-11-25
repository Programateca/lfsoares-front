import { Label } from "./ui/label";
import {
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select,
  SelectContent,
} from "./ui/select";

interface SelectMapProps {
  placeholder: string;
  itens: { id: string; name: string }[];
  input_name: string;
  label: string;
}

export function SelectMap({
  itens,
  placeholder,
  input_name,
  label,
}: SelectMapProps) {
  return (
    <>
      <Label htmlFor={input_name}>{label}</Label>
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className="text-start">
            {itens.map((item) => {
              return (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
