import Image from "next/image";

export default function AppFooter() {
  return (
    <footer
      className="w-full mt-auto py-6 px-4 flex flex-col sm:flex-row justify-between items-center shadow transition-colors"
      style={{ background: "none", color: "var(--foreground)" }}
    >
      <span className="w-full text-center block mb-6 sm:mb-0">
        © {new Date().getFullYear()} ¡Gracias por escuchar Nuestra.M-Radio.Eclipse! — Hecho con Next.js
      </span>
      <span className="mt-4 sm:mt-0 sm:ml-4 flex items-center gap-4 font-semibold">
        <Image
          src="/RadioEclipse2.0.png"
          alt="Radio Eclipse 106.3"
          width={140}
          height={140}
          className="rounded"
          priority={false}
        />
        Radio Eclipse 106.3 · Canelones, Uruguay
      </span>
    </footer>
  );
}