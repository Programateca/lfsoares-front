interface ParticipanteMap {
  [key: string]: string;
}

export function fillParticipants(
  data: any,
  participantes: any[],
  certificadoCode: number,
  fullYear: number
) {
  // @ts-ignore
  const participantesMap = data.participantes.reduce((acc, id, index) => {
    const participante = participantes.find((pessoa) => pessoa.id === id);
    const rowIndex = index + 1;

    acc[`p_nome${rowIndex}`] = participante?.name || "";
    acc[`p_matricula${rowIndex}`] = participante?.matricula
      ? participante?.matricula
      : participante?.cpf || "";
    acc[`p_manha${rowIndex}`] = "PRESENTE/APTO";
    acc[`p_tarde${rowIndex}`] = "PRESENTE/APTO";
    acc[`p_noite${rowIndex}`] = "PRESENTE/APTO";
    acc[`p_codigo${rowIndex}`] = participante
      ? `LFSTS ${String(certificadoCode + index).padStart(4, "0")}/${fullYear}`
      : "";
    acc[`p_id${rowIndex}`] = participante ? participante.id : "";

    return acc;
  }, {} as ParticipanteMap);

  // Ajuste para múltiplo de 10
  const totalParticipants = data.participantes.length;
  const nextMultipleOfTen = Math.ceil(totalParticipants / 10) * 10;
  const padding = nextMultipleOfTen - totalParticipants;

  for (let i = 1; i <= padding; i++) {
    const index = totalParticipants + i;
    participantesMap[`p_nome${index}`] = "";
    participantesMap[`p_matricula${index}`] = "";
    participantesMap[`p_codigo${index}`] = "";
    participantesMap[`p_id${index}`] = "";
    participantesMap[`p_manha${index}`] = "";
    participantesMap[`p_tarde${index}`] = "";
    participantesMap[`p_noite${index}`] = "";
  }

  return participantesMap;
}
