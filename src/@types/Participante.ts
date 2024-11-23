import { Empresa } from "./Empresa";

export interface Participante {
  cpf: string;
  createdAt: string;
  empresa: Empresa;
  id: string;
  matricula: string;
  name: string;
  status: { id: number };
  updatedAt: string;
}
