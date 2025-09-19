import { api } from "@/lib/axios";

export interface ListaData {
  id: string;
  // Define other lista properties as needed
  [key: string]: any;
}

export interface ListasResponse {
  data: ListaData[];
}

export interface CreateListaData {
  // Define the structure for creating listas
  [key: string]: any;
}

export interface UpdateListaData {
  // Define the structure for updating listas
  [key: string]: any;
}

export const listasService = {
  async getListas(params?: {
    page?: number;
    limit?: number;
  }): Promise<ListasResponse> {
    const response = await api.get("listas", { params });
    return response.data;
  },

  async createLista(data: CreateListaData): Promise<ListaData> {
    const response = await api.post("documentos", data);
    return response.data;
  },

  async updateLista(id: string, data: UpdateListaData): Promise<ListaData> {
    const response = await api.patch(`documentos/${id}`, data);
    return response.data;
  },

  async getListaById(id: string): Promise<ListaData> {
    const response = await api.get(`documentos/${id}`);
    return response.data;
  },
};

export const listasDataService = {
  async getIdentificadores(params?: {
    limit?: number;
  }): Promise<{ data: { data: any[] } }> {
    const response = await api.get("identificadores", { params });
    return response.data;
  },

  async getEmpresas(params?: {
    limit?: number;
  }): Promise<{ data: { data: any[] } }> {
    const response = await api.get("empresas", { params });
    return response.data;
  },

  async getDocumentos(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: { data: any[]; hasNextPage: boolean } }> {
    const response = await api.get("documentos", { params });
    return response.data;
  },
};
