import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Provider } from "jotai";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import { DragAndDropProvider } from "@/components/DragDropProvider";
import "./globals.css";
import { ThemeColorManager } from "@/components/ThemeColorManager";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Provider>
            <DragAndDropProvider>
              <ThemeColorManager />
              <div className="h-screen w-screen flex flex-col max-h-[-webkit-fill-available] overflow-hidden">
                <Header />

                {children}
              </div>
            </DragAndDropProvider>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
