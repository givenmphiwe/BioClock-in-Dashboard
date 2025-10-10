import { Navigate } from "react-router-dom";
import { isSessionValid } from "./session";

export default function DecideLanding() {
  return isSessionValid()
    ? <Navigate to="/Home" replace />
    : <Navigate to="/login" replace />;
}
