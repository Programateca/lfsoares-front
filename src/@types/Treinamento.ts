import { Status } from "./Status";

export interface Treinamento {
  status: Status;
  courseModality: string;
  courseType: string;
  description: string;
  courseValidaty: string;
  courseHours: string;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}
