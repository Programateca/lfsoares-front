import { api } from "@/lib/axios";

export interface Empresa {
  id: string;
  name: string;
  cnpj?: string;
  endereco?: string;
  createdAt?: string;
  updatedAt?: string;
  // Campo correto retornado pela API
  statusId?: number;
}

export interface EmpresasResponse {
  data: Empresa[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateEmpresaData {
  name: string;
  cnpj?: string;
  endereco?: string;
}

export interface UpdateEmpresaData {
  name?: string;
  cnpj?: string;
  endereco?: string;
}

export interface UpdateEmpresaStatusData {
  statusId: number;
}

export const empresasService = {
  async getEmpresas(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<EmpresasResponse> {
    const response = await api.get("empresas", { params });
    return response.data;
  },

  async createEmpresa(data: CreateEmpresaData): Promise<Empresa> {
    const response = await api.post("empresas", data);
    return response.data;
  },

  async updateEmpresa(
    id: string | number,
    data: UpdateEmpresaData
  ): Promise<Empresa> {
    const response = await api.patch(`empresas/${id}`, data);
    return response.data;
  },

  async updateEmpresaStatus(
    id: string | number,
    data: UpdateEmpresaStatusData
  ): Promise<Empresa> {
    const response = await api.patch(`empresas/${id}`, data);
    return response.data;
  },

  async getEmpresaById(id: string): Promise<Empresa> {
    const response = await api.get(`empresas/${id}`);
    return response.data;
  },
};
