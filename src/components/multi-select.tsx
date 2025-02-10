import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const multiSelectVariants = cva("m-1 transition ease-in-out", {
  variants: {
    variant: {
      default: "border-black text-foreground bg-white ",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  options: {
    label: string;
    value: string;
    cpf?: string;
    matricula?: string;
    empresa?: string;
  }[];
  onValueChange: (value: string[]) => void;
  defaultValue?: string[];
  placeholder?: string;
  animation?: number;
  maxCount?: number;
  modalPopover?: boolean;
  asChild?: boolean;
  className?: string;
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      modalPopover = false,
      asChild = false,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedValues, setSelectedValues] =
      React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const toggleOption = (option: string) => {
      setSelectedValues((prevValues) => {
        const newValues = prevValues.includes(option)
          ? prevValues.filter((val) => val !== option)
          : [...prevValues, option];
        onValueChange(newValues);
        return newValues;
      });
    };

    const filteredOptions = options.filter((option) => {
      const searchLower = searchTerm.trim().toLowerCase();
      if (!searchLower) return true; // Exibir todos os itens se a busca estiver vazia

      return (
        option.label.toLowerCase().includes(searchLower) ||
        option.cpf?.toLowerCase().includes(searchLower) ||
        option.matricula?.toLowerCase().includes(searchLower) ||
        option.empresa?.toLowerCase().includes(searchLower)
      );
    });

    const toggleAll = () => {
      if (selectedValues.length === options.length) {
        setSelectedValues([]);
        onValueChange([]);
      } else {
        const allValues = options.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }
    };

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            variant={"outline"}
            className={cn(
              "flex w-full h-full min-h-9 p-1 rounded-md border",
              className
            )}
          >
            {selectedValues.length > 0 ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap items-center">
                  {selectedValues.map((value) => {
                    const option = options.find((o) => o.value === value);
                    return (
                      <Badge
                        key={value}
                        className={cn(multiSelectVariants({ variant }))}
                      >
                        {option?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground mx-3">
                {placeholder}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar..."
              value={searchTerm}
              onValueChange={(value) => setSearchTerm(value)}
            />
            <CommandList>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  key="select_all"
                  onSelect={toggleAll}
                  className="cursor-pointer"
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                    <CheckIcon
                      className={
                        selectedValues.length === options.length
                          ? "h-4 w-4"
                          : "opacity-0"
                      }
                    />
                  </div>
                  <span>
                    {selectedValues.length === options.length
                      ? "Remover todos"
                      : "Selecionar todos"}
                  </span>
                </CommandItem>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleOption(option.value)}
                    className="cursor-pointer"
                  >
                    <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                      <CheckIcon
                        className={
                          selectedValues.includes(option.value)
                            ? "h-4 w-4"
                            : "opacity-0"
                        }
                      />
                    </div>
                    <span>
                      {option.label}
                      {option.cpf && ` (${option.cpf}`}
                      {option.matricula && ` - ${option.matricula}`}
                      {option.empresa && ` - ${option.empresa}`}
                      {(option.cpf || option.matricula || option.empresa) &&
                        ")"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
