import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isSessionValid } from "./session";

export default function PublicOnly() {
  const location = useLocation();
  if (isSessionValid()) {
    // Already signed in and not expired: go straight to Home
    return <Navigate to="/home" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
