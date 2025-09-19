import { api } from "@/lib/axios";
import { Evento } from "@/@types/Evento";
import { Pessoa } from "@/@types/Pessoa";
import { Instrutor } from "@/@types/Instrutor";
import { IdentificadorData } from "@/@types/IdentificadorData";

export interface IdentificadoresResponse {
  data: IdentificadorData[];
  hasNextPage: boolean;
}

export interface EventosResponse {
  data: Evento[];
}

export interface PessoasResponse {
  data: Pessoa[];
}

export interface InstrutoresResponse {
  data: Instrutor[];
}

export interface CreateIdentificadorData {
  // Define the structure for creating identificadores
  [key: string]: any;
}

export const identificadoresService = {
  async getIdentificadores(params?: {
    page?: number;
    limit?: number;
  }): Promise<IdentificadoresResponse> {
    const response = await api.get("identificadores", { params });
    return response.data;
  },

  async createIdentificador(
    data: CreateIdentificadorData
  ): Promise<IdentificadorData> {
    const response = await api.post("identificadores", data);
    return response.data;
  },

  async deleteIdentificador(id: string): Promise<void> {
    await api.delete(`identificadores/${id}`);
  },

  async downloadIdentificador(id: string): Promise<Blob> {
    const response = await api.get(`identificadores/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  },
};

export const eventosService = {
  async getEventos(params?: { limit?: number }): Promise<EventosResponse> {
    const response = await api.get("eventos", { params });
    return response.data;
  },
};

export const instrutoresService = {
  async getInstrutores(params?: {
    limit?: number;
  }): Promise<InstrutoresResponse> {
    const response = await api.get("instrutores", { params });
    return response.data;
  },
};
