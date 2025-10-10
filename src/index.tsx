import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { StyledEngineProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Login from "./pages/Login";
import App from "./Dashboard";
import RequireAuth from "./auth/RequireAuth";
import PublicOnly from "./auth/PublicOnly";
import DecideLanding from "./auth/DecideLanding";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Default: choose based on session validity */}
            <Route path="/" element={<DecideLanding />} />

            {/* Public routes that should be hidden if already authenticated */}
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Private routes */}
            <Route element={<RequireAuth />}>
              <Route path="/home" element={<App />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<DecideLanding />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
