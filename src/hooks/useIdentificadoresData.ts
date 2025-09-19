import { useState } from "react";
import { Evento } from "@/@types/Evento";
import { Pessoa } from "@/@types/Pessoa";
import { Instrutor } from "@/@types/Instrutor";
import { IdentificadorData } from "@/@types/IdentificadorData";
import toast from "react-hot-toast";
import {
  identificadoresService,
  eventosService,
  instrutoresService,
} from "@/services/identificadoresService";
import { pessoasService } from "@/services/pessoasService";

export const useIdentificadoresData = () => {
  const [loading, setLoading] = useState(true);
  const [identificadoresGerados, setIdentificadoresGerados] = useState<
    IdentificadorData[]
  >([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [participantes, setParticipantes] = useState<Pessoa[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const limit = 20;

  const fetchData = async (pageNumber: number = 1) => {
    try {
      console.log("Fetching data for page:", pageNumber);
      setLoading(true);
      const response = await identificadoresService.getIdentificadores({
        page: pageNumber,
        limit,
      });
      console.log("Identificadores response:", response);

      const [eventosResp, pessoasResp, instrutoresResp] = await Promise.all([
        eventosService.getEventos({ limit: 100000 }),
        pessoasService.getPessoas({ limit: 100000 }),
        instrutoresService.getInstrutores({ limit: 100000 }),
      ]);

      console.log("All data fetched successfully");
      setHasNextPage(response.hasNextPage);
      setIdentificadoresGerados(response.data);
      setEventos(eventosResp.data.filter((e: any) => e.status?.id === 1));
      setParticipantes(pessoasResp.data.filter((e: any) => e.status?.id === 1));
      setInstrutores(
        instrutoresResp.data.filter((inst: any) => inst.status?.id === 1)
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao buscar dados iniciais");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage > page && !hasNextPage) {
      toast.error("Não há registros para esta página.");
      return;
    }

    try {
      setLoading(true);
      const response = await identificadoresService.getIdentificadores({
        page: newPage,
        limit,
      });
      setIdentificadoresGerados(response.data);
      setPage(newPage);
      setHasNextPage(response.hasNextPage);
    } catch (error) {
      toast.error("Erro ao buscar eventos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await identificadoresService.deleteIdentificador(id);
      toast.success("Identificador excluído com sucesso!");
      await fetchData();
    } catch (error) {
      toast.error("Erro ao excluir identificador");
    } finally {
      setLoading(false);
    }
  };

  const downloadIdentificador = async (id: string, row?: any) => {
    try {
      if (row) {
        // ✅ Parseando documentData antes de chamar gerarIdentificador
        const identificadorParsed = row.identificadorData
          ? JSON.parse(row.identificadorData)
          : null;

        if (!identificadorParsed) {
          console.warn("Dados do identificador inválidos:", row);
          return;
        }

        // Import the gerarIdentificador function
        const { gerarIdentificador } = await import("@/utils/identificador");

        gerarIdentificador(
          {
            ...identificadorParsed,
            id_code: String(row.code).padStart(3, "0"),
          },
          identificadorParsed.courseData,
          identificadorParsed.numeroParticipantes
        );
      } else {
        // Fallback to API download if no row data is provided
        const response = await identificadoresService.downloadIdentificador(id);
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `identificador_${id}.docx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erro ao processar o identificador:", error);
      toast.error("Erro ao baixar identificador");
    }
  };

  // Remove useEffect to prevent infinite loops - data will be fetched in component

  return {
    loading,
    identificadoresGerados,
    eventos,
    participantes,
    instrutores,
    page,
    hasNextPage,
    fetchData,
    handlePageChange,
    handleDelete,
    downloadIdentificador,
    setIdentificadoresGerados,
  };
};
