import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, principal } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="auth-boot">
        <p>Restoring session…</p>
      </div>
    );
  }

  if (!principal) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
