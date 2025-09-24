import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/core/contexts/AuthContext";
import { OrganizationProvider } from "@/core/contexts/OrganizationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TintOps - Window Tinting CRM",
  description: "Complete CRM solution for window tinting shops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <OrganizationProvider>
            {children}
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
