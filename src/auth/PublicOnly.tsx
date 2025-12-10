import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) {
    return null; 
  }
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
