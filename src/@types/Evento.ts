import { Empresa } from "./Empresa";
import { Instrutor } from "./Instrutor";
import { Status } from "./Status";
import { Treinamento } from "./Treinamento";

export interface Evento {
  status: Status;
  empresa: Empresa;
  instrutor: Instrutor;
  treinamento: Treinamento;
  courseLocation: string;
  responsavelTecnico: string;
  completionDate: string;
  courseTime: string;
  courseDate: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}
