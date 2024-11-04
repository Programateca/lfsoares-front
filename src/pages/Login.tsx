import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.svg";
import { Link, useNavigate } from "react-router-dom";
export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
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
              Por favor, faça login na sua conta para acessar o sistema
            </p>
          </div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
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
                id="senha"
                type="password"
                placeholder="********"
                required
                className="focus-visible:ring-green-800 text-gray-700 text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 focus-visible:ring-green-800"
            >
              Entrar
            </Button>
          </form>
          <div className="text-center">
            <Link
              to="/esqueceu-senha"
              className="text-sm text-primary hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
