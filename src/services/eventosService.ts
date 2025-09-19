import { api } from "@/lib/axios";
import { Evento } from "@/@types/Evento";
import { Empresa } from "@/@types/Empresa";
import { Treinamento } from "@/@types/Treinamento";

export interface EventosResponse {
  data: Evento[];
  hasNextPage: boolean;
}

export interface TreinamentosResponse {
  data: Treinamento[];
}

export interface EmpresasResponse {
  data: Empresa[];
}

export interface CreateEventoData {
  // Define the structure for creating eventos
  [key: string]: any;
}

export interface UpdateEventoData {
  // Define the structure for updating eventos
  [key: string]: any;
}

export const eventosService = {
  async getEventos(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<EventosResponse> {
    const response = await api.get("eventos", { params });
    return response.data;
  },

  async createEvento(data: CreateEventoData): Promise<Evento> {
    const response = await api.post("eventos", data);
    return response.data;
  },

  async updateEvento(
    id: string | number,
    data: UpdateEventoData
  ): Promise<Evento> {
    const response = await api.patch(`eventos/${id}`, data);
    return response.data;
  },

  async getEventoById(id: string): Promise<Evento> {
    const response = await api.get(`eventos/${id}`);
    return response.data;
  },
};

export const treinamentosService = {
  async getTreinamentos(params?: {
    limit?: number;
  }): Promise<TreinamentosResponse> {
    const response = await api.get("treinamentos", { params });
    return response.data;
  },
};

export const empresasService = {
  async getEmpresas(params?: { limit?: number }): Promise<EmpresasResponse> {
    const response = await api.get("empresas", { params });
    return response.data;
  },
};
