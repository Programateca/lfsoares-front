export type Period = "manha" | "tarde" | "manhaTarde";
type Schedule = { dia: string; periodo?: Period };
type DaySchedule = { instrutorA: Schedule[]; instrutorB: Schedule[] };
type EventSchedule = DaySchedule;

export interface Identificador {
  id: string;
  documentData: string;
  mudar_modulo: string;
  mudar_horarios: string;
  id_code: string;
  id_data: string;
  responsavel_tecnico: string;
  // TODO
  //   ...participantesMap,
  conteudo_aplicado: string;
  numeroParticipantes: number;
  motivo_treinamento: string;
  objetivo_lf: string;
  treinamento: string;
  treinamento_lista: string; // TODO Checar: possivelmente igual a treinamento
  contratante: string;
  tipo: string;
  carga_horaria: string;
  intervalo: string;
  endereco: string;
  empresa: string;
  datas: string;
  // Assinaturas
  assinante_titulo1: string;
  assinante_titulo2: string;
  assinante_titulo3: string;
  assinante_titulo4: string;
  assinante1: string;
  assinante2: string;
  assinante3: string;
  assinante4: string;

  instrutor_a: string;
  instrutor_b: string;

  instrutorDates: EventSchedule;

  // add
  certificateYear?: string | number;
  certificateCode?: number | string;
}
