import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { useEncryption } from "@/contexts/EncryptionContext";
import { generateSecurePassphrase, validatePassphrase } from "@/lib/encryption";

interface EncryptionSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const EncryptionSetup: React.FC<EncryptionSetupProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { setEncryptionPassphrase } = useEncryption();
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPassphrase, setGeneratedPassphrase] = useState("");
  const [copied, setCopied] = useState(false);
  const [useGenerated, setUseGenerated] = useState(false);

  const handleGeneratePassphrase = () => {
    const newPassphrase = generateSecurePassphrase();
    setGeneratedPassphrase(newPassphrase);
    setUseGenerated(true);
    setPassphrase(newPassphrase);
    setConfirmPassphrase(newPassphrase);
  };

  const handleCopyPassphrase = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassphrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy passphrase:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passphrase) {
      setError("Please enter an encryption passphrase");
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      return;
    }

    const validation = validatePassphrase(passphrase);
    if (!validation.isValid && !useGenerated) {
      setError(validation.message);
      return;
    }

    setEncryptionPassphrase(passphrase);
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Setup Client-Side Encryption
          </DialogTitle>
          <DialogDescription>
            Protect your notes and tasks with end-to-end encryption. Your data
            will be encrypted in your browser before being saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Your encryption passphrase is never
              sent to our servers. If you lose it, your encrypted data cannot be
              recovered.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Generate Secure Passphrase
              </CardTitle>
              <CardDescription className="text-xs">
                We recommend using a generated passphrase for maximum security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassphrase}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </Button>
                {generatedPassphrase && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassphrase}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {generatedPassphrase && (
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {generatedPassphrase}
                </div>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="passphrase">Encryption Passphrase</Label>
              <div className="relative">
                <Input
                  id="passphrase"
                  type={showPassphrase ? "text" : "password"}
                  placeholder="Enter your encryption passphrase"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    setUseGenerated(false);
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                >
                  {showPassphrase ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassphrase">Confirm Passphrase</Label>
              <Input
                id="confirmPassphrase"
                type={showPassphrase ? "text" : "password"}
                placeholder="Confirm your encryption passphrase"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Enable Encryption
              </Button>
              <Button type="button" variant="outline" onClick={handleSkip}>
                Skip for Now
              </Button>
            </div>
          </form>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              • Your passphrase is stored only in memory while you're logged in
            </p>
            <p>• Data is encrypted using AES-256-GCM encryption</p>
            <p>• You can enable encryption later in settings</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EncryptionSetup;
