import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { EncryptionProvider } from "./contexts/EncryptionContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./components/home";
import routes from "tempo-routes";

function App() {
  return (
    <AuthProvider>
      <EncryptionProvider>
        <Suspense fallback={<p>Loading...</p>}>
          <>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
            </Routes>
            {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          </>
        </Suspense>
      </EncryptionProvider>
    </AuthProvider>
  );
}

export default App;
