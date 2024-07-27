import React, { useCallback, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, Alert, Button } from 'react-native';

export default function RecaptchaComponent({ onVerify }: { onVerify: (token: string) => void }) {
  const webviewRef = useRef<WebView>(null);

  const handleMessage = useCallback((event: any) => {
    const { data } = event.nativeEvent;
    if (data.startsWith('recaptcha-token:')) {
      const token = data.split('recaptcha-token:')[1];
      onVerify(token);
    }
  }, [onVerify]);

  const reloadRecaptcha = () => {
    webviewRef.current?.reload();
  };

  return (
    <View style={{ flex: 1, height: 100 }}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        injectedJavaScript={`document.getElementById('recaptcha-submit').onclick = function() {
          grecaptcha.execute();
        };`}
        source={{
          html: `
          <!DOCTYPE html>
          <html>
  <head>
    <title>reCAPTCHA demo: Simple page</title>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <style>
            .grecaptcha {
            width: 100%;
            height: 100%;}
    </style>
  </head>
      <form action="?" method="POST">
        <div class="g-recaptcha" data-sitekey="6LeZ6xUqAAAAAAhJvZzEpukyehV-myJxecXSL-fa"></div>
      </form>

  </body>
</html>
          `,
        }}
      />
      <Button title="Reload reCAPTCHA" onPress={reloadRecaptcha} />
    </View>
  );
}
