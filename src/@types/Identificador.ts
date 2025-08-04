export type Period = "manha" | "tarde" | "manhaTarde";

export type CourseData = {
  date: {
    date: string;
    start: string;
    end: string;
    intervalStart: string;
    intervalEnd: string;
  };
  address: {
    morning?: string;
    afternoon?: string;
    night?: string;
  };
  instrutorA: {
    instrutor?: string;
    periodo?: string;
  };
  instrutorB: {
    instrutor?: string;
    periodo?: string;
  };
  instrutoresConfig?: Array<{
    instrutor?: string;
    periodo?: string;
    id?: string; // Assuming id might be part of this config from Identificadores.tsx
  }>;
};

export interface Identificador {
  assinatura: string;
  id: string;
  identificadorData: string;
  modulo: string;
  horarios: string;
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
  empresa_id: string;
  evento_id: string;

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

  courseData: CourseData[];

  // add
  certificateYear: string;
  certificateCode?: number | string;
}
