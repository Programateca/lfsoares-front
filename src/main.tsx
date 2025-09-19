import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login.tsx";
import Home from "./pages/Home.tsx";
import Usuarios from "@/components/Usuarios";
import Eventos from "@/components/Eventos";
import Treinamentos from "@/components/Treinamentos";
import Integrantes from "@/components/Integrantes";
import Pessoas from "@/components/Pessoas";
import Empresas from "@/components/Empresas";
import Certificados from "@/components/Certificados";
import ListaPresenca from "@/components/ListaPresenca";
import { Identificadores } from "@/components/Identificadores";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicRoute } from "@/routes/PublicRoute";
import { AuthProvider } from "./context/AuthContextProvider.tsx";
import { Toaster } from "react-hot-toast";
import NotFound from "./pages/NotFound.tsx";
import ErrorFallback from "./pages/ErrorFallback.tsx";

if (!import.meta.env.VITE_BACKEND_DOMAIN)
  throw new Error("Env VITE_BACKEND_DOMAIN missing");

const router = createBrowserRouter([
  {
    path: "/login",
    errorElement: <ErrorFallback />,
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: "/",
    errorElement: <ErrorFallback />,
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: null },
      { path: "usuarios", element: <Usuarios /> },
      { path: "eventos", element: <Eventos /> },
      { path: "treinamentos", element: <Treinamentos /> },
      { path: "integrantes", element: <Integrantes /> },
      { path: "pessoas", element: <Pessoas /> },
      { path: "empresas", element: <Empresas /> },
      { path: "certificados", element: <Certificados /> },
      { path: "lista", element: <ListaPresenca /> },
      { path: "identificadores", element: <Identificadores /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" reverseOrder={false} />
    </AuthProvider>
  </StrictMode>
);
