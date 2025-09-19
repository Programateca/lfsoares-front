import { api } from "@/lib/axios";
import { Evento } from "@/@types/Evento";
import { Pessoa } from "@/@types/Pessoa";
import { Instrutor } from "@/@types/Instrutor";
import { Empresa } from "@/@types/Empresa";

export interface CertificadoData {
  id: string;
  // Define other certificado properties as needed
  [key: string]: any;
}

export interface CertificadosResponse {
  data: any[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DocumentosResponse {
  data: any[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateDocumentoData {
  // Define the structure for creating documentos
  [key: string]: any;
}

export interface UpdateDocumentoData {
  // Define the structure for updating documentos
  [key: string]: any;
}

export const certificadosService = {
  async getCertificados(params?: {
    page?: number;
    limit?: number;
  }): Promise<CertificadosResponse> {
    const response = await api.get("certificados", { params });
    return response.data;
  },

  async getIdentificadores(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: any[] }> {
    const response = await api.get("identificadores", { params });
    return response.data;
  },

  async getEventos(params?: { limit?: number }): Promise<{ data: Evento[] }> {
    const response = await api.get("eventos", { params });
    return response.data;
  },

  async getPessoas(params?: { limit?: number }): Promise<{ data: Pessoa[] }> {
    const response = await api.get("pessoas", { params });
    return response.data;
  },

  async getInstrutores(params?: {
    limit?: number;
  }): Promise<{ data: Instrutor[] }> {
    const response = await api.get("instrutores", { params });
    return response.data;
  },

  async getEmpresas(params?: { limit?: number }): Promise<{ data: Empresa[] }> {
    const response = await api.get("empresas", { params });
    return response.data;
  },
};

export const documentosService = {
  async getDocumentos(params?: {
    page?: number;
    limit?: number;
  }): Promise<DocumentosResponse> {
    const response = await api.get("documentos", { params });
    return response.data;
  },

  async createDocumento(data: CreateDocumentoData): Promise<any> {
    const response = await api.post("documentos", data);
    return response.data;
  },

  async updateDocumento(id: string, data: UpdateDocumentoData): Promise<any> {
    const response = await api.patch(`documentos/${id}`, data);
    return response.data;
  },

  async getDocumentoById(id: string): Promise<any> {
    const response = await api.get(`documentos/${id}`);
    return response.data;
  },
};
