function compact(value: string) {
  return value.toLocaleLowerCase("es-CL").replace(/\s+/g, "").trim();
}

export function collapseCumulativeTranscripts(transcripts: string[]) {
  let result = "";

  for (const rawTranscript of transcripts) {
    const transcript = rawTranscript.trim();
    if (!transcript) continue;

    if (!result) {
      result = transcript;
      continue;
    }

    const compactResult = compact(result);
    const compactTranscript = compact(transcript);

    // Chrome móvil puede emitir: "uno", "uno dos", "uno dos tres".
    // En ese caso la hipótesis más reciente reemplaza a la anterior.
    if (compactTranscript.startsWith(compactResult)) {
      result = transcript;
      continue;
    }

    // Ignora una hipótesis atrasada que ya está contenida al final.
    if (compactResult.endsWith(compactTranscript)) continue;

    result = `${result} ${transcript}`;
  }

  return result.trim();
}
