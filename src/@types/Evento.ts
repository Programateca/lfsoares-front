import { Empresa } from "./Empresa";
import { Status } from "./Status";
import { Treinamento } from "./Treinamento";

export interface Evento {
  status: Status;
  empresa: Empresa;
  treinamento: Treinamento;
  courseLocation: string;
  courseLocation2: string;
  courseDate: string;
  completionDate: string;
  courseTime: string;
  courseInterval: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}
