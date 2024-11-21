import { Status } from "./Status";

export interface Empresa {
  status: Status;
  cnpj: string;
  name: string;
  endereco: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}
