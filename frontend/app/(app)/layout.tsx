import Header from "@/components/Header";
import { LoginOverlay } from "@/components/LoginOverlay";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen flex flex-col max-h-[-webkit-fill-available] overflow-hidden">
      <LoginOverlay />
      <Header />

      {children}
    </div>
  );
}
