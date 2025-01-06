import { Button } from "@/components/ui/button";
import { gerarIdentificador } from "@/utils/aux";

const CONTEUDO =
  " 1.	Garantir a segurança dos trabalhadores que adentrarem nos espaços confinados;\n2.	Identificação dos espaços confinados;\n3.	Critérios de indicação e uso de equipamentos para controle de riscos;\n4.	Conhecimentos sobre práticas seguras em espaços confinados;\n5.	Legislação de segurança e saúde no trabalho;\n6.	Programa de proteção respiratória;\n7.	Area classificada;\n8.	Operações de salvamento.\n9.	Reconhecimento, avaliação e controle de riscos;\n10.	Funcionamento de equipamentos utilizados;\n11.	Procedimentos e utilização da Permissão de Entrada e Trabalho; e\n12.	Noções de resgate e primeiros socorros. \n";
export function TesteComponent() {
  const dataObj = {
    instrutor1_titulo: "INSTRUTOR:",
    instrutor1_nome:
      "ELLINGTON ADILSON DA SILVA SANTANA - TÉCNICO DE SEGURANÇA DO TRABALHO - MTE Nº 0011572/MS",
    instrutor2_titulo: "INSTRUTOR:",
    instrutor2_nome:
      "ELLINGTON ADILSON DA SILVA SANTANA - TÉCNICO DE SEGURANÇA DO TRABALHO - MTE Nº 0011572/MS",
    instrutor3_titulo: "INSTRUTOR:",
    instrutor3_nome:
      "ELLINGTON ADILSON DA SILVA SANTANA - TÉCNICO DE SEGURANÇA DO TRABALHO - MTE Nº 0011572/MS",
    instrutor4_titulo: "RESPONSÁVEL TÉCNICA DA CAPACITAÇÃO:",
    instrutor4_nome:
      "CLEDIONE JUNQUEIRA DE ABREU – ENGENHEIRA DE SEGURANÇA DO TRABALHO – CREA N° 9949-MS",

    treinamento: "Nome do Treinamento",
    tipo: "Formação ou Atualização periódica",
    carga_horaria: "08 HORAS AULA",
    modulo: "TEÓRICO E PRÁTICO",
    datas: "05/11/2024",
    horarios: "08:00 AS 17:00",
    intervalo: "12:00 AS 13:00",
    endereco: "RODOVIA BR 262, KM 25 ZONA RURAL, TRÊS LAGOAS - MS, 79601-970",
    conteudo: CONTEUDO,

    participante1: "Participante 1",
    participante1matricula: "005.659.796-71",
    participante1codigo: "LFSTS 1634/2024",
    participante2: "Participante 2",
    participante2matricula: "005.659.796-71",
    participante2codigo: "LFSTS 1634/2024",
  };

  return (
    <div className="p-10">
      <Button onClick={() => gerarIdentificador(1)}>Teste</Button>
    </div>
  );
}
