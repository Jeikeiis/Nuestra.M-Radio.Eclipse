"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") setDarkMode(false);
    if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement; // Usar <html> para Tailwind
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      className={`px-4 py-2 rounded font-semibold shadow transition-all
        bg-gray-800 text-white hover:bg-gray-700
        dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 w-[110px]`}
      onClick={() => setDarkMode((v) => !v)}
      aria-label="Cambiar modo claro/oscuro"
    >
      {darkMode ? "Modo Claro" : "Modo Oscuro"}
    </button>
  );
}