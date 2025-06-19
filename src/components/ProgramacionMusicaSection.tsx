import React from "react";
import ApiProgramSection from "./ApiProgramSection";

export default function ProgramacionMusicaSection() {
  return (
    <ApiProgramSection
      apiPath="/api/musica"
      cacheKey="musicaCacheLocal"
      sectionClass="programacion-musica-section"
      updatedMsg="¡Música actualizada!"
      emptyMsg="No se encontraron noticias de música relevantes."
      adminKey="adminNoticias"
    />
  );
}
