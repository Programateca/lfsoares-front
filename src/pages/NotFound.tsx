import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-gray-600 mb-6">Página não encontrada.</p>
        <Link to="/" className="text-green-600 hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
