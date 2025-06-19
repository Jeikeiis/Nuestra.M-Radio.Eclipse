import React from "react";
import ApiProgramSection from "./ApiProgramSection";

export default function ProgramacionNoticiasSection() {
  return (
    <ApiProgramSection
      apiPath="/api/noticias"
      cacheKey="noticiasCacheLocal"
      sectionClass="programacion-noticias-section"
      updatedMsg="¡Noticias actualizadas!"
      emptyMsg="No se encontraron noticias relevantes."
      adminKey="adminNoticias"
    />
  );
}
