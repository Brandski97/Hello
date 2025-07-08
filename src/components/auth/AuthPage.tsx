import React, { useState } from "react";
import { Shield, Lock, Zap, Eye, Globe } from "lucide-react";
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
    <div className="min-h-screen bg-background flex">
      {/* Left Section - Logo and Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-primary rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-primary rounded-full blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary rounded-3xl mb-6 shadow-2xl">
              <Shield className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4 text-center">
              SecureSpace
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-8">
              Privacy-First Workspace
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl border border-primary/20">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  End-to-End Encrypted
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your data is encrypted before it leaves your device
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl border border-primary/20">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Zero Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  We don't track, store, or sell your personal data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl border border-primary/20">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Open Source</h3>
                <p className="text-sm text-muted-foreground">
                  Transparent code you can trust and verify
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl border border-primary/20">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Lightning Fast
                </h3>
                <p className="text-sm text-muted-foreground">
                  Optimized for speed and productivity
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo (shown only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              SecureSpace
            </h1>
            <p className="text-muted-foreground">Privacy-First Workspace</p>
          </div>

          {/* Auth Forms */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {mode === "login" && (
              <LoginForm
                onToggleMode={handleToggleMode}
                onForgotPassword={handleForgotPassword}
              />
            )}
            {mode === "signup" && (
              <SignUpForm onToggleMode={handleToggleMode} />
            )}
            {mode === "forgot-password" && (
              <ForgotPasswordForm onBack={handleBackToLogin} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
