import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuestra Mañana FM 106.3",
  description: "Escucha nuestra radio en vivo las 24 horas.",
  openGraph: {
    title: "Nuestra Mañana FM 106.3",
    description: "Escucha nuestra radio en vivo las 24 horas.",
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
    description: "Escucha nuestra radio en vivo las 24 horas.",
    images: ["/NuestraManana2.0.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/webp" href="/favicon.webp" />
      </head>
      <body className="bg-white text-black dark:bg-black dark:text-white transition-colors">
        {children}
      </body>
    </html>
  );
}
