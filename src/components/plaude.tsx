import React, { createContext, useContext, useState } from 'react';
import { WebView } from 'react-native-webview';

const PlaudeContext = createContext<
  | {
      open: () => void;
      close: () => void;
    }
  | undefined
>(undefined);

type PlaudeComponentProps = {
  open: boolean;
  userId: string;
  token: string;
};

function PlaudeComponent({ open }: PlaudeComponentProps) {
  if (!open) return;

  return <WebView />;
}

type PlaudeProviderProps = {
  userId: string;
  token: string;
  children: React.ReactNode;
};

export const PlaudeProvider = ({
  userId,
  token,
  children,
}: PlaudeProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);

  const close = () => setIsOpen(false);

  return (
    <PlaudeContext.Provider value={{ open, close }}>
      <PlaudeComponent open={isOpen} userId={userId} token={token} />
      {children}
    </PlaudeContext.Provider>
  );
};

export const usePlaude = () => {
  const context = useContext(PlaudeContext);

  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }

  return context;
};
