import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestra Mañana FM 106.3",
  description: "Lunes a Viernes de 10 a 13 horas. Escucha nuestra radio en vivo las 24 horas.",
  openGraph: {
    title: "Nuestra Mañana FM 106.3",
    description: "Lunes a Viernes de 10 a 13 horas. Escucha nuestra radio en vivo las 24 horas.",
    url: "https://nuestramananaradioeclipse-git-main-jeikeiis-projects.vercel.app/",
    siteName: "Nuestra Mañana FM 106.3",
    images: [
      {
        url: "/NuestraManana2.0.webp",
        width: 1200,
        height: 630,
        alt: "Nuestra Mañana logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuestra Mañana FM 106.3",
    description: "Lunes a Viernes de 10 a 13 horas. Escucha nuestra radio en vivo las 24 horas.",
    images: ["/NuestraManana2.0.webp"],
  },
};
