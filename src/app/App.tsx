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
      <div className="min-h-screen flex items-center justify-center bg-[#2E8B57]">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center">
            <Leaf className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold">EcoTrack</h1>
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
