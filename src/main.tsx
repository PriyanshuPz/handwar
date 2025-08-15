import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />

        {/*           <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"> */}
        <Toaster
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2",
              description: "text-xs mt-1 text-blue-200",
              title: "text-sm",
            },
          }}
          richColors
          position="top-center"
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
