import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular o envio do email
    setTimeout(() => {
      setIsLoading(false);
      setCountdown(30);
    }, 2000);
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
      <div className="flex w-1/2 items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 px-4 sm:px-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Esqueceu sua senha?</h1>
            <p className="text-muted-foreground">
              Digite seu e-mail para receber um link de recuperação
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600"
              disabled={isLoading || countdown > 0}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : countdown > 0 ? (
                `Tentar novamente em ${countdown}s`
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
