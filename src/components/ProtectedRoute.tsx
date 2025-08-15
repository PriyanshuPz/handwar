import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold animate-bounce">Loading{dots}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
}
