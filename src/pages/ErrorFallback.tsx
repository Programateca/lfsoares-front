import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export default function ErrorFallback() {
  const error = useRouteError();

  let message = "Ocorreu um erro inesperado.";
  if (isRouteErrorResponse(error)) {
    message = `${error.status} - ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2">Algo deu errado</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Voltar para o início
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Recarregar página
          </button>
        </div>
      </div>
    </div>
  );
}
