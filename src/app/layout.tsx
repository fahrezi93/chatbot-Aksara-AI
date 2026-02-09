import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "regenerator-runtime/runtime";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aksara AI - Asisten Cerdas Indonesia",
  description: "Aksara AI adalah chatbot cerdas yang mendukung multiple AI models dengan interface modern dan responsif.",
  keywords: ["AI", "chatbot", "Gemini", "DeepSeek", "Indonesia", "assistant"],
  authors: [{ name: "Aksara AI Team" }],
  icons: {
    icon: "/Aksara-AI-Logo.png",
  },
  openGraph: {
    title: "Aksara AI - Asisten Cerdas Indonesia",
    description: "Chatbot cerdas dengan dukungan multiple AI models",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
