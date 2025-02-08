import logo from "@/assets/logo.svg";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContextProvider";
import { api } from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Role = "User";

type LoginResponseData = {
  refreshToken: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: { id: number; name: Role };
  };
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const emailInput = useRef<HTMLInputElement>(null);
  const senhaInput = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = {
      email: emailInput.current?.value,
      password: senhaInput.current?.value,
    };

    api
      .post<LoginResponseData>("auth/email/login", body)
      .then(({ data }) => {
        if (data) {
          login({ ...data.user, token: data.token });
          toast.success("Login efetuado com sucesso!");
          navigate("/");
        }
      })
      .catch(() => {
        toast.error("Erro ao efetuar login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-1/2 hidden md:flex">
        <img
          src="https://images.unsplash.com/photo-1628147529780-36964fbb8d54?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Visual de login"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex w-1/2 items-center justify-center bg-gray-50 max-sm:w-full">
        <div className="w-full max-w-lg space-y-8 px-4 sm:px-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <img src={logo} alt="Logo da empresa" className="h-40" />
            </div>
            <p className="text-gray-700 text-lg">
              Faça login na sua conta para acessar o sistema
            </p>
          </div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                ref={emailInput}
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="focus-visible:ring-green-800 text-gray-700 text-base"
              />
            </div>
            <div className="space-y-2 pb-4">
              <Label htmlFor="senha">Senha</Label>
              <Input
                ref={senhaInput}
                id="senha"
                type="password"
                placeholder="********"
                required
                className="focus-visible:ring-green-800 text-gray-700 text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 focus-visible:ring-green-800 disabled:opacity-[60%]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="text-lg mr-2 h-full w-full animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
