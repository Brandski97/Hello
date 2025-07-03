import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEncryption } from "@/contexts/EncryptionContext";
import { Loader2 } from "lucide-react";
import AuthPage from "./AuthPage";
import EncryptionSetup from "./EncryptionSetup";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { clearEncryptionPassphrase } = useEncryption();
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);
  const [encryptionSetupComplete, setEncryptionSetupComplete] = useState(false);

  useEffect(() => {
    if (user && !encryptionSetupComplete) {
      // Show encryption setup dialog after successful login
      const timer = setTimeout(() => {
        setShowEncryptionSetup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, encryptionSetupComplete]);

  useEffect(() => {
    // Clear encryption passphrase when user logs out
    if (!user) {
      clearEncryptionPassphrase();
      setEncryptionSetupComplete(false);
    }
  }, [user, clearEncryptionPassphrase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      {children}
      <EncryptionSetup
        isOpen={showEncryptionSetup}
        onClose={() => setShowEncryptionSetup(false)}
        onComplete={() => {
          setEncryptionSetupComplete(true);
          setShowEncryptionSetup(false);
        }}
      />
    </>
  );
};

export default ProtectedRoute;
