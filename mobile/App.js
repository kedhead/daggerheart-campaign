import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

/**
 * Native shell for the Lorelich player app.
 *
 * The screen itself is the mobile web build (`npm run build:mobile` in the
 * repo root), loaded in a WebView. That build boots straight into the player
 * portal — character sheet, inventory, dice — and shares Firestore with the
 * table, so a roll made here lands on the GM's screen immediately.
 *
 * Deliberately NOT a SafeAreaView wrapper: the web build ships
 * `viewport-fit=cover` and the portal already pads with env(safe-area-inset-*).
 * Insetting again would double the padding and leave a dead band under the
 * notch. The WebView goes edge to edge and CSS owns the insets.
 */

const APP_URL = Constants.expoConfig?.extra?.appUrl ?? 'https://app.lorelich.com';
const BACKGROUND = '#0b0a14';

/**
 * Injected into the page. Bridges the roll event the dice tray dispatches
 * (see src/dice/DiceTray.jsx) out to native so we can fire haptics.
 * Must end with `true;` or the WebView logs a warning on iOS.
 */
const INJECTED_JS = `
  (function () {
    if (window.__lorelichBridge) return;
    window.__lorelichBridge = true;
    window.addEventListener('lorelich:roll', function (e) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'roll',
          crit: !!(e.detail && e.detail.crit),
          critFail: !!(e.detail && e.detail.critFail),
        }));
      } catch (err) {}
    });
  })();
  true;
`;

function ErrorScreen({ onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Can't reach the table</Text>
      <Text style={styles.errorBody}>
        Lorelich needs a connection to sync with your campaign. Check your
        signal and try again.
      </Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const webRef = useRef(null);
  const canGoBackRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // Bumped to force a remount on retry — reload() alone won't recover a
  // WebView that failed before it ever had a document.
  const [attempt, setAttempt] = useState(0);

  // Android's hardware back should walk the web history before leaving the
  // app, which is what users expect from a back button anywhere else.
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback((event) => {
    let msg;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch (err) {
      return;
    }
    if (msg.type !== 'roll') return;
    if (msg.crit) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (msg.critFail) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setAttempt(n => n + 1);
  }, []);

  return (
    <View style={styles.root}>
      {/* Light content on the portal's near-black background. translucent so
          the page paints behind the status bar and its safe-area padding
          does the spacing. */}
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {failed ? (
        <ErrorScreen onRetry={retry} />
      ) : (
        <WebView
          key={attempt}
          ref={webRef}
          source={{ uri: APP_URL }}
          style={styles.web}
          // Keeps the page's own background visible during load instead of
          // the white flash a default WebView shows.
          containerStyle={styles.webContainer}
          // Firebase auth persistence and the Firestore offline cache both
          // live in browser storage; without these the player is signed out
          // on every launch.
          domStorageEnabled
          javaScriptEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          // Dice sounds must be able to start from the app's own tap
          // handling rather than requiring a separate user gesture.
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          // The portal is a single scrolling column; bounce reads as the
          // sheet coming unstuck from the header.
          bounces={false}
          overScrollMode="never"
          // Anything that isn't our own origin (an invite link a player
          // taps, a rules reference) belongs in the real browser.
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.startsWith(APP_URL) || req.url.startsWith('about:')) return true;
            Linking.openURL(req.url).catch(() => {});
            return false;
          }}
          injectedJavaScript={INJECTED_JS}
          onMessage={onMessage}
          onNavigationStateChange={(nav) => { canGoBackRef.current = nav.canGoBack; }}
          onLoadEnd={() => setLoading(false)}
          // onError fires for the main document; onHttpError catches a
          // deploy serving a 4xx/5xx, which otherwise renders as a blank
          // screen with no way back.
          onError={() => { setLoading(false); setFailed(true); }}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 400) { setLoading(false); setFailed(true); }
          }}
        />
      )}

      {loading && !failed && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#eab308" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  web: { flex: 1, backgroundColor: BACKGROUND },
  webContainer: { backgroundColor: BACKGROUND },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BACKGROUND,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: BACKGROUND,
  },
  errorTitle: { color: '#eab308', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  errorBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.4)',
    backgroundColor: 'rgba(234,179,8,0.12)',
  },
  retryText: { color: '#eab308', fontWeight: '700', letterSpacing: 1 },
});
