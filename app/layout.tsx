import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const lexend = Lexend({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Strucly - Visual AI Knowledge Tool",
  description: "A visual canvas where you structure knowledge, connect ideas, and let AI think with you. Plug-and-Think architecture for 10× more productive AI workflows.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={lexend.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
