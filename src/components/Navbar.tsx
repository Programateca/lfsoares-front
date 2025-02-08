import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import logo from "@/assets/logo.svg";
import { MonitorCog } from "lucide-react";
import { Contact } from "lucide-react";
import { Ticket } from "lucide-react";
import { BookOpen } from "lucide-react";
import { IdCard } from "lucide-react";
import { Building2 } from "lucide-react";
import { Users } from "lucide-react";
import { Layout } from "lucide-react";
import { FileText } from "lucide-react";
import { ClipboardList } from "lucide-react";

type ComponentKeys =
  | ""
  | "Usuários"
  | "Eventos"
  | "Treinamentos"
  | "Integrantes"
  | "Pessoas"
  | "Empresas"
  | "Certificados"
  | "Lista"
  | "Identificadores";

type NavbarProps = {
  selectedOption: ComponentKeys;
  handleSelectedOption: (option: ComponentKeys) => void;
  isCadastroOpen: boolean;
  toggleCadastro: () => void;
  isLayoutOpen: boolean;
  toggleLayout: () => void;
};

export const Navbar = ({
  selectedOption,
  handleSelectedOption,
  isCadastroOpen,
  toggleCadastro,
  isLayoutOpen,
  toggleLayout,
}: NavbarProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-center pb-5 border-b-2">
        <img src={logo} alt="Logo da empresa" className="h-[3.5rem]" />
      </div>
      <div className="space-y-4 pt-5">
        <div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={toggleCadastro}
          >
            <MonitorCog className="mr-2 h-4 w-4" />
            Cadastros
            {isCadastroOpen ? (
              <ChevronUp className="ml-auto h-4 w-4" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4" />
            )}
          </Button>
          {isCadastroOpen && (
            <div className="ml-4 mt-2 space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  selectedOption === "Usuários" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Usuários")}
              >
                <Contact className="mr-2 h-4 w-4" />
                Usuários
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  selectedOption === "Eventos" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Eventos")}
              >
                <Ticket className="mr-2 h-4 w-4" />
                Eventos
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  selectedOption === "Treinamentos" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Treinamentos")}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Treinamentos
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  selectedOption === "Integrantes" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Integrantes")}
              >
                <IdCard className="mr-2 h-4 w-4" />
                Integrantes
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  selectedOption === "Empresas" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Empresas")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Empresas
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  selectedOption === "Pessoas" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Pessoas")}
              >
                <Users className="mr-2 h-4 w-4" />
                Pessoas
              </Button>
            </div>
          )}
        </div>

        <div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={toggleLayout}
          >
            <Layout className="mr-2 h-4 w-4" />
            Layout
            {isLayoutOpen ? (
              <ChevronUp className="ml-auto h-4 w-4" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4" />
            )}
          </Button>
          {isLayoutOpen && (
            <div className="ml-4 mt-2 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedOption === "Identificadores" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Identificadores")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Identificadores
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedOption === "Certificados" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Certificados")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Certificados
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleSelectedOption("Lista")}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Lista de Presença
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
