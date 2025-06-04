"use client";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import RadioDashboard from "../components/RadioDashboard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col transition-colors">
      {/* Encabezado */}
      <AppHeader />

      {/* Sección principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <RadioDashboard />
      </main>

      {/* Pie de página */}
      <AppFooter />
    </div>
  );
}