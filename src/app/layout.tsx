import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radio Eclipse FM 106.3",
  description: "Escucha nuestra radio en vivo las 24 horas.",
  openGraph: {
    title: "Radio Eclipse FM 106.3",
    description: "Escucha nuestra radio en vivo las 24 horas.",
    url: "https://nuestramananaradioeclipse-git-main-jeikeiis-projects.vercel.app/",
    siteName: "Radio Eclipse FM 106.3",
    images: [
      {
        url: "/RadioEclipse2.0.webp",
        width: 1200,
        height: 630,
        alt: "Radio Eclipse logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radio Eclipse FM 106.3",
    description: "Escucha nuestra radio en vivo las 24 horas.",
    images: ["/RadioEclipse2.0.webp"],
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
