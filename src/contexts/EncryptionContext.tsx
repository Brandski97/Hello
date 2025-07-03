import React, { createContext, useContext, useState, useCallback } from "react";
import { encryptData, decryptData } from "@/lib/encryption";

interface EncryptionContextType {
  isEncryptionEnabled: boolean;
  encryptionPassphrase: string | null;
  setEncryptionPassphrase: (passphrase: string) => void;
  clearEncryptionPassphrase: () => void;
  encryptContent: (
    content: string,
  ) => Promise<{ encryptedData: string; iv: string; salt: string } | null>;
  decryptContent: (
    encryptedData: string,
    iv: string,
    salt: string,
  ) => Promise<string | null>;
  hasValidPassphrase: boolean;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(
  undefined,
);

export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error("useEncryption must be used within an EncryptionProvider");
  }
  return context;
};

interface EncryptionProviderProps {
  children: React.ReactNode;
}

export const EncryptionProvider: React.FC<EncryptionProviderProps> = ({
  children,
}) => {
  const [encryptionPassphrase, setEncryptionPassphraseState] = useState<
    string | null
  >(null);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);

  const setEncryptionPassphrase = useCallback((passphrase: string) => {
    setEncryptionPassphraseState(passphrase);
    setIsEncryptionEnabled(true);
  }, []);

  const clearEncryptionPassphrase = useCallback(() => {
    setEncryptionPassphraseState(null);
    setIsEncryptionEnabled(false);
  }, []);

  const encryptContent = useCallback(
    async (content: string) => {
      if (!encryptionPassphrase || !isEncryptionEnabled) {
        return null;
      }

      try {
        return await encryptData(content, encryptionPassphrase);
      } catch (error) {
        console.error("Encryption failed:", error);
        return null;
      }
    },
    [encryptionPassphrase, isEncryptionEnabled],
  );

  const decryptContent = useCallback(
    async (encryptedData: string, iv: string, salt: string) => {
      if (!encryptionPassphrase || !isEncryptionEnabled) {
        return null;
      }

      try {
        return await decryptData({
          encryptedData,
          iv,
          salt,
          passphrase: encryptionPassphrase,
        });
      } catch (error) {
        console.error("Decryption failed:", error);
        return null;
      }
    },
    [encryptionPassphrase, isEncryptionEnabled],
  );

  const hasValidPassphrase = Boolean(
    encryptionPassphrase && isEncryptionEnabled,
  );

  const value = {
    isEncryptionEnabled,
    encryptionPassphrase,
    setEncryptionPassphrase,
    clearEncryptionPassphrase,
    encryptContent,
    decryptContent,
    hasValidPassphrase,
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
};
