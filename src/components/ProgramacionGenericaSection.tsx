import React from "react";
import ApiProgramSection from "./ApiProgramSection";

interface ApiProgramSectionProps {
  apiPath: string;
  cacheKey: string;
  sectionClass: string;
  updatedMsg: string;
  emptyMsg: string;
  adminKey?: string;
}

export default function ProgramacionGenericaSection(props: ApiProgramSectionProps) {
  // Redirige a ApiProgramSection para unificar la lógica de caché y presentación
  return <ApiProgramSection {...props} />;
}
