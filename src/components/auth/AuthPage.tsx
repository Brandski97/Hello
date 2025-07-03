import React, { useState } from "react";
import { Shield } from "lucide-react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

type AuthMode = "login" | "signup" | "forgot-password";

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");

  const handleToggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  const handleForgotPassword = () => {
    setMode("forgot-password");
  };

  const handleBackToLogin = () => {
    setMode("login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 shadow-lg">
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            SecureSpace
          </h1>
          <p className="text-muted-foreground text-lg">
            Privacy-First Workspace
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              End-to-end encrypted • Open source • No tracking
            </span>
          </div>
        </div>

        {/* Auth Forms */}
        {mode === "login" && (
          <LoginForm
            onToggleMode={handleToggleMode}
            onForgotPassword={handleForgotPassword}
          />
        )}
        {mode === "signup" && <SignUpForm onToggleMode={handleToggleMode} />}
        {mode === "forgot-password" && (
          <ForgotPasswordForm onBack={handleBackToLogin} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
