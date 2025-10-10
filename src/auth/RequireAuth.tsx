import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isSessionValid } from "./session";

export default function RequireAuth() {
  const location = useLocation();
  if (!isSessionValid()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}