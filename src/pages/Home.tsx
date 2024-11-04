import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ChevronDown,
  Users,
  BookOpen,
  Layout,
  FileText,
  ClipboardList,
  LogOut,
  Settings,
  IdCard,
  Contact,
} from "lucide-react";
import logo from "@/assets/logo.svg";
import Usuarios from "@/components/Usuarios";
import Treinamentos from "@/components/Treinamentos";
import Instrutores from "@/components/Instrutores";
import Pessoas from "@/components/Pessoas";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContextProvider";

const componentsMap = {
  Usuários: Usuarios,
  Treinamentos: Treinamentos,
  Instrutores: Instrutores,
  Pessoas: Pessoas,
} as const;

type ComponentKeys = keyof typeof componentsMap;

console.log(import.meta.env.VITE_BACKEND_DOMAIN)

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth()

  const [selectedOption, setSelectedOption] = useState<ComponentKeys | "">("");

  const handleSelectedOption = (option: ComponentKeys) => {
    setSelectedOption(option);
  };

  const handleLogOut = () => {
    logout()
    navigate("/login")
  }


  useEffect(() => {
    if(!isAuthenticated()) navigate('/login')
      console.log('User', user)
  }, [isAuthenticated, navigate, user])

  return (
    <div className="min-h-screen h-full flex flex-col">
      <div className="flex flex-1 h-full">
        <div className="w-[17rem] fixed h-full overflow-y-auto border-r bg-background py-8 px-4">
          <div className="flex flex-col h-full">
            <div className="flex justify-center pb-5 border-b-2">
              <img src={logo} alt="Logo da empresa" className="h-[3.5rem]" />
            </div>
            <div className="space-y-4 pt-5">
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
                  selectedOption === "Pessoas" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleSelectedOption("Pessoas")}
              >
                <Users className="mr-2 h-4 w-4" />
                Pessoas
              </Button>
              <div>
                <Button variant="ghost" className="w-full justify-start">
                  <Layout className="mr-2 h-4 w-4" />
                  Layout
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
                <div className="ml-4 mt-2 space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="/layout/certificado">
                      <FileText className="mr-2 h-4 w-4" />
                      Certificado
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="/layout/lista-presenca">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Lista de Presença
                    </a>
                  </Button>
                </div>
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
                <Settings className="h-5 w-5 text-gray-600" />
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
                  <h1 className="text-4xl font-bold">
                    Olá, {user?.firstName} 👋
                  </h1>
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
