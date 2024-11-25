import { Empresa } from "./Empresa";

export interface Instrutor {
  cpf: string;
  createdAt: string;
  empresa: Empresa;
  id: string;
  matricula: string;
  name: string;
  status: { id: number };
  updatedAt: string;
}
