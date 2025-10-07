import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { StyledEngineProvider } from "@mui/material/styles";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Login from "./pages/Login";
import App from "./Dashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Default route -> Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Private */}
            <Route >
              <Route path="/Home" element={<App />} />
            </Route>


            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
