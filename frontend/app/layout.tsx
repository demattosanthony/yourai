import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DragAndDropProvider } from "@/components/DragDropProvider";
import ReactQueryProvider from "./providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <JotaiProvider>
              <DragAndDropProvider>
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
