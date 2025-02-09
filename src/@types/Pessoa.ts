import { Status } from "./Status";

export interface Pessoa {
  status: Status;
  name: string;
  cpf: string;
  id: string;
  empresa: any;
  matricula: string;
  createdAt: string;
  updatedAt: string;
}
