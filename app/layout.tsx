import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MFMCF FUTA PRIESTS OF GOD GENERATION — Worker's Appreciation 202",
  description: "Verified fellowship voting system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
