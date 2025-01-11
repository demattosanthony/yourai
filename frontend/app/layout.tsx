import type { Metadata } from "next";
import localFont from "next/font/local";
import { Provider } from "jotai";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import { DragAndDropProvider } from "@/components/DragDropProvider";
import "./globals.css";

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
  //   manifest: "/manifest.json",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Provider>
            <DragAndDropProvider>
              <div className="h-screen w-screen flex flex-col">
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
