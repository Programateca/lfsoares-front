import { Status } from "./Status";

export interface Treinamento {
  conteudoAplicado: string | null;
  status: Status;
  courseModality: string;
  courseMethodology: string;
  coursePortaria: string;
  courseType: string;
  description: string;
  courseValidaty: string;
  courseHours: string;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}
