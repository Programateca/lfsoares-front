import { ModelType } from "@/@types/ModeType";
import { api } from "@/lib/axios";
import { AxiosError } from "axios";

export async function getLastDocumentCode(
  year: string,
  tipo: ModelType
): Promise<number> {
  try {
    const response = await api.get<number>(
      `/documentos/last-cert-code?type=${tipo}&year=${year}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Error fetching documents:", error.response?.data);
    } else {
      console.error("An unexpected error occurred:", error);
    }
    throw error;
  }
}
