import { Status } from "./Status";

export interface Pessoa {
  status: Status;
  name: string;
  cpf: string;
  id: string;
  matricula: string;
  createdAt: string;
  updatedAt: string;
}
