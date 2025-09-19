import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { LogOut } from "lucide-react";
import Usuarios from "@/components/Usuarios";
import Treinamentos from "@/components/Treinamentos";
import Integrantes from "@/components/Integrantes";
import Pessoas from "@/components/Pessoas";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContextProvider";
import Empresas from "@/components/Empresas";
import Eventos from "@/components/Eventos";
import Certificados from "@/components/Certificados";
import ListaPresenca from "@/components/ListaPresenca";
import { Identificadores } from "@/components/Identificadores";
import { Navbar } from "@/components/Navbar";

const componentsMap = {
  Usuários: Usuarios,
  Eventos,
  Treinamentos,
  Integrantes,
  Pessoas,
  Empresas,
  Certificados,
  Lista: ListaPresenca,
  Identificadores: Identificadores,
} as const;

type ComponentKeys = keyof typeof componentsMap;

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const [selectedOption, setSelectedOption] = useState<ComponentKeys | "">("");
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  const handleSelectedOption = (option: ComponentKeys | "") => {
    setSelectedOption(option);
    // push route reflecting selection
    const routeMap: Record<ComponentKeys, string> = {
      Usuários: "/usuarios",
      Eventos: "/eventos",
      Treinamentos: "/treinamentos",
      Integrantes: "/integrantes",
      Pessoas: "/pessoas",
      Empresas: "/empresas",
      Certificados: "/certificados",
      Lista: "/lista",
      Identificadores: "/identificadores",
    };
    if (option && routeMap[option as ComponentKeys]) {
      navigate(routeMap[option as ComponentKeys]);
    } else if (option === "") {
      navigate("/");
    }
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

  // Sync selected component from current path
  useEffect(() => {
    const path = location.pathname;
    const map: Record<string, ComponentKeys> = {
      "/usuarios": "Usuários",
      "/eventos": "Eventos",
      "/treinamentos": "Treinamentos",
      "/integrantes": "Integrantes",
      "/pessoas": "Pessoas",
      "/empresas": "Empresas",
      "/certificados": "Certificados",
      "/lista": "Lista",
      "/identificadores": "Identificadores",
    };
    if (map[path]) {
      setSelectedOption(map[path]);
    } else if (path === "/") {
      setSelectedOption("");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen h-full flex flex-col">
      <div className="flex flex-1 h-full">
        <div className="w-[17rem] fixed h-full overflow-y-auto border-r bg-background py-8 px-4 z-20">
          <Navbar
            toggleCadastro={toggleCadastro}
            toggleLayout={toggleLayout}
            handleSelectedOption={handleSelectedOption}
            isCadastroOpen={isCadastroOpen}
            isLayoutOpen={isLayoutOpen}
            selectedOption={selectedOption}
          />
        </div>
        <div className="flex-1 ml-64 p-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {selectedOption}
            </h1>
            <div className="flex items-center space-x-2">
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
                    Bem-vindo ao Sistema de Layout de Treinamentos e Serviços
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
