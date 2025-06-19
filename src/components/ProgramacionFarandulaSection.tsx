import React from "react";
import ApiProgramSection from "./ApiProgramSection";

export default function ProgramacionFarandulaSection() {
  return (
    <ApiProgramSection
      apiPath="/api/farandula"
      cacheKey="farandulaCacheLocal"
      sectionClass="programacion-farandula-section"
      updatedMsg="¡Farándula actualizada!"
      emptyMsg="No se encontraron noticias de farándula relevantes."
      adminKey="adminNoticias"
    />
  );
}
