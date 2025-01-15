import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DragAndDropProvider } from "@/components/DragDropProvider";
import { ThemeColorManager } from "@/components/ThemeColorManager";
import ReactQueryProvider from "./providers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Yo",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "var(--theme-color)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  minimumScale: 1,
};

export const experimental_ppr = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <JotaiProvider>
              <DragAndDropProvider>
                <ThemeColorManager />

                <Toaster />

                {children}
              </DragAndDropProvider>
            </JotaiProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
