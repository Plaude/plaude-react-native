import React, { createContext, useContext, useState } from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const PlaudeContext = createContext<
  | {
      openMessenger: () => void;
      closeMessenger: () => void;
      setToken: (token: string) => void;
    }
  | undefined
>(undefined);

const usePlaude = () => {
  const context = useContext(PlaudeContext);

  if (!context) {
    throw new Error(
      'It seems like you forgot to wrap your app with the PlaudeProvider component.',
    );
  }

  return context;
};

type PlaudeMessengerProps = React.PropsWithChildren<{
  appId: string;
  open: boolean;
  token?: string;
}>;

function PlaudeMessenger({
  appId,
  open,
  token,
  children,
}: PlaudeMessengerProps) {
  const { closeMessenger } = usePlaude();

  return (
    <>
      {children}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <Pressable
          onPress={closeMessenger}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            zIndex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 24,
            }}
          >
            ✖
          </Text>
        </Pressable>
        <WebView
          useWebView2
          source={{
            uri: `https://embed.plaudeai.com/messenger?appId${appId}&token=${token}`,
          }}
        />
      </Modal>
    </>
  );
}

type PlaudeProviderProps = React.PropsWithChildren<{
  appId?: string;
}>;

const PlaudeProvider = ({ appId, children }: PlaudeProviderProps) => {
  if (!(process.env.PLAUDE_APP_ID ?? appId)) {
    throw new Error('It seems like you forgot to set the App ID.');
  }

  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [token, setToken] = useState<string>();

  const openMessenger = () => {
    if (!isMessengerOpen) setIsMessengerOpen(true);
  };

  const closeMessenger = () => {
    if (isMessengerOpen) setIsMessengerOpen(false);
  };

  return (
    <PlaudeContext.Provider value={{ openMessenger, closeMessenger, setToken }}>
      <PlaudeMessenger
        appId={(process.env.PLAUDE_APP_ID ?? appId)!}
        open={isMessengerOpen}
        token={token}
      >
        {children}
      </PlaudeMessenger>
    </PlaudeContext.Provider>
  );
};

export { PlaudeProvider, usePlaude };
