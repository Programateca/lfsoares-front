import { api } from "@/lib/axios";

export interface Status {
  id: number;
  name: string;
}

export interface Empresa {
  id: string | number;
  name: string;
}

export interface Pessoa {
  id: string;
  name: string;
  cpf: string;
  matricula: string;
  empresaId: number | string | null;
  createdAt: string;
  updatedAt: string;
  // Campos opcionais que podem vir do backend
  empresa?: Empresa;
  statusId?: number;
}

export interface PessoasResponse {
  data: Pessoa[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface EmpresasResponse {
  data: Empresa[];
  total?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface CreatePessoaData {
  name: string;
  cpf: string;
  matricula: string;
  empresaId?: number | null;
}

export interface UpdatePessoaData {
  name?: string;
  cpf?: string;
  matricula?: string;
  empresaId?: number | null;
}

export interface UpdateStatusData {
  statusId: number;
}

export const pessoasService = {
  async getPessoas(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PessoasResponse> {
    const response = await api.get("pessoas", { params });

    // Verificar se a resposta tem a estrutura esperada
    let pessoasData = response.data;
    if (response.data && response.data.data) {
      // Se a resposta tem uma propriedade 'data' aninhada
      pessoasData = response.data;
    } else if (Array.isArray(response.data)) {
      // Se a resposta é diretamente um array
      pessoasData = {
        data: response.data,
        total: response.data.length,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    console.log(
      "API Pessoas - Total retornado:",
      pessoasData.data?.length || pessoasData.length
    );
    return pessoasData;
  },

  async createPessoa(data: CreatePessoaData): Promise<Pessoa> {
    const response = await api.post("pessoas", data);
    return response.data;
  },

  async updatePessoa(
    id: string | number,
    data: UpdatePessoaData
  ): Promise<Pessoa> {
    const response = await api.patch(`pessoas/${id}`, data);
    return response.data;
  },

  async updatePessoaStatus(
    id: string | number,
    data: UpdateStatusData
  ): Promise<Pessoa> {
    const response = await api.patch(`pessoas/${id}`, data);
    return response.data;
  },
};

export const empresasService = {
  async getEmpresas(): Promise<EmpresasResponse> {
    const response = await api.get("empresas");

    // Verificar se a resposta tem a estrutura esperada
    let empresasData = response.data;
    if (response.data && response.data.data) {
      // Se a resposta tem uma propriedade 'data' aninhada
      empresasData = response.data;
    } else if (Array.isArray(response.data)) {
      // Se a resposta é diretamente um array
      empresasData = {
        data: response.data,
      };
    }

    console.log(
      "API Empresas - Total retornado:",
      empresasData.data?.length || empresasData.length
    );
    return empresasData;
  },
};
