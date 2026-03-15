import { RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import { router } from "./routes";

export default function App() {
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
