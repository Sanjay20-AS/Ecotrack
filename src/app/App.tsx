import { RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import { router } from "./routes";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-primary via-emerald-800 to-emerald-950 px-6">
        <div className="flex flex-col items-center gap-5 text-primary-foreground text-center">
          <div className="w-24 h-24 rounded-[1.75rem] bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
            <Leaf className="h-11 w-11 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">EcoTrack</h1>
            <p className="text-sm text-white/80 mt-1">Waste less, live lighter</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            maxWidth: "90vw",
            fontSize: "14px",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: {
            style: { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
            iconTheme: { primary: "#059669", secondary: "#ecfdf5" },
          },
          error: {
            duration: 5000,
            style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
            iconTheme: { primary: "#dc2626", secondary: "#fef2f2" },
          },
        }}
      />
    </>
  );
}
