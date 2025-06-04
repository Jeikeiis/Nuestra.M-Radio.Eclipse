import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

export default function AppHeader() {
  return (
    <header className="flex flex-col items-center py-10 shadow-lg transition-colors">
      <Image
        src="/NuestraMañana2.0.png"
        alt="Logo Nuestra.M-Radio.Eclipse"
        width={140}
        height={140}
        className="mb-4 rounded-lg"
        priority
      />
      <h1 className="text-4xl font-bold tracking-tight mb-2 text-center" style={{ color: "var(--foreground)" }}>
        Nuestra.M-Radio.Eclipse
      </h1>
      <p className="text-lg text-center max-w-xl" style={{ color: "var(--foreground)" }}>
        La mejor música, en vivo y online. ¡Conéctate, escucha y comparte!
      </p>
      <ThemeToggle />
    </header>
  );
}