import { Status } from "./Status";

export interface Pessoa {
  status: Status;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}
