import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const BASE_URL = 'https://plaudeai.com';

const PlaudeContext = createContext<
  | {
      openMessenger: () => void;
      closeMessenger: () => void;
    }
  | undefined
>(undefined);

type PlaudeComponentProps = {
  appId?: string;
  userId: string;
  token: string;
  open: boolean;
  children: React.ReactNode;
};

function PlaudeComponent({
  open,
  appId,
  userId,
  token,
  children,
}: PlaudeComponentProps) {
  const { closeMessenger } = usePlaude();
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string>();

  useEffect(() => {
    const fetchAccessToken = async () => {
      const response = await fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        body: JSON.stringify({
          appId: process.env.PLAUDE_APP_ID ?? appId,
          userId,
          token,
        }),
      });
      const accessToken = (await response.json()).accessToken;
      if (accessToken) setAccessToken(accessToken);
      setIsLoading(false);
    };

    fetchAccessToken();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <Pressable
          onPress={closeMessenger}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            zIndex: 10,
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
            uri: `${BASE_URL}/chat`,
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          }}
        />
      </Modal>
    </View>
  );
}

type PlaudeProviderProps = {
  appId?: string;
  userId: string;
  token: string;
  children: React.ReactNode;
};

export const PlaudeProvider = ({
  appId,
  userId,
  token,
  children,
}: PlaudeProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMessenger = () => setIsOpen(true);

  const closeMessenger = () => setIsOpen(false);

  return (
    <PlaudeContext.Provider value={{ openMessenger, closeMessenger }}>
      <PlaudeComponent
        open={isOpen}
        appId={process.env.PLAUDE_APP_ID ?? appId}
        userId={userId}
        token={token}
      >
        {children}
      </PlaudeComponent>
    </PlaudeContext.Provider>
  );
};

export const usePlaude = () => {
  const context = useContext(PlaudeContext);

  if (!context) {
    throw new Error(
      'It seems like you forgot to wrap your app with the PlaudeProvider component.',
    );
  }

  return context;
};
