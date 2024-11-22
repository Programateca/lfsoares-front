import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ChevronDown,
  Users,
  Layout,
  FileText,
  ClipboardList,
  LogOut,
  IdCard,
  Contact,
  Building2,
  MonitorCog,
  ChevronUp,
  BookOpen,
  Ticket,
  Radar,
} from "lucide-react";
import logo from "@/assets/logo.svg";
import Usuarios from "@/components/Usuarios";
import Treinamentos from "@/components/Treinamentos";
import Instrutores from "@/components/Instrutores";
import Pessoas from "@/components/Pessoas";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContextProvider";
import Empresas from "@/components/Empresas";
import Eventos from "@/components/Eventos";
import Certificados from "@/components/Certificados";
import Presenca from "@/components/Presenca";

const componentsMap = {
  Usuários: Usuarios,
  Eventos,
  Treinamentos,
  Instrutores,
  Pessoas,
  Empresas,
  Certificados,
  'Lista de Presença': Presenca,
} as const;

type ComponentKeys = keyof typeof componentsMap;

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const [selectedOption, setSelectedOption] = useState<ComponentKeys | "">("");
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  const handleSelectedOption = (option: ComponentKeys) => {
    setSelectedOption(option);
  };

  const toggleCadastro = () => {
    setIsCadastroOpen(!isCadastroOpen);
  };

  const toggleLayout = () => {
    setIsLayoutOpen(!isLayoutOpen);
  };

  const handleLogOut = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!isAuthenticated()) navigate("/login");
  }, [isAuthenticated, navigate, user]);

  return (
    <div className="min-h-screen h-full flex flex-col">
      <div className="flex flex-1 h-full">
        <div className="w-[17rem] fixed h-full overflow-y-auto border-r bg-background py-8 px-4 z-20">
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
                        selectedOption === "Instrutores" ? "bg-gray-100" : ""
                      }`}
                      onClick={() => handleSelectedOption("Instrutores")}
                    >
                      <IdCard className="mr-2 h-4 w-4" />
                      Instrutores
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
                      className={`w-full justify-start ${
                        selectedOption === "Lista de Presença" ? "bg-gray-100" : ""
                      }`}
                      onClick={() => handleSelectedOption("Lista de Presença")}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Lista de Presença
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 ml-64 p-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {selectedOption}
            </h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="px-4">
                <Radar className="h-5 w-5 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-gray-600 
                hover:text-gray-700 px-4"
                onClick={handleLogOut}
              >
                <LogOut className="h-5 w-5 " />
                Sair
              </Button>
            </div>
          </header>
          {selectedOption === "" ? (
            <Card className="bg-green-500 rounded-xl shadow-lg">
              <CardContent className="p-5 py-4">
                <div className="text-start text-white">
                  <h1 className="text-4xl font-bold">Olá, {user?.name} 👋</h1>
                  <p className="mt-2 text-xl">
                    Bem-vindo ao Sistema de Geração de Documentos de Treinamento
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            selectedOption &&
            componentsMap[selectedOption] &&
            React.createElement(componentsMap[selectedOption])
          )}
        </div>
      </div>
    </div>
  );
}
