import { api } from "@/lib/axios";
export interface Instrutor {
  id: string;
  name: string;
  cpf: string;
  qualificacao: string;
  createdAt: string;
  updatedAt: string;
  // Campo opcional que pode vir do backend
  registroProfissional?: string;
  statusId?: number;
}

export interface InstrutoresResponse {
  data: Instrutor[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateInstrutorData {
  name: string;
  cpf: string;
  qualificacao: string;
}

export interface UpdateInstrutorData {
  name?: string;
  cpf?: string;
  qualificacao?: string;
}

export interface UpdateInstrutorStatusData {
  statusId: number;
}

export const instrutoresService = {
  async getInstrutores(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<InstrutoresResponse> {
    const response = await api.get("instrutores", { params });
    return response.data;
  },

  async createInstrutor(data: CreateInstrutorData): Promise<Instrutor> {
    const response = await api.post("instrutores", data);
    return response.data;
  },

  async updateInstrutor(
    id: string | number,
    data: UpdateInstrutorData
  ): Promise<Instrutor> {
    const response = await api.patch(`instrutores/${id}`, data);
    return response.data;
  },

  async updateInstrutorStatus(
    id: string | number,
    data: UpdateInstrutorStatusData
  ): Promise<Instrutor> {
    const response = await api.patch(`instrutores/${id}`, data);
    return response.data;
  },

  async getInstrutorById(id: string): Promise<Instrutor> {
    const response = await api.get(`instrutores/${id}`);
    return response.data;
  },
};
