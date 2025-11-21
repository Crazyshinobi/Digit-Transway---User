import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AadhaarWebView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);

  const { verificationUrl, onVerificationComplete } = route.params;

  useEffect(() => {
    // Handle Android back button
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        Alert.alert(
          'Cancel Verification',
          'Are you sure you want to cancel Aadhaar verification?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => navigation.goBack() },
          ],
        );
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  const handleNavigationStateChange = navState => {
    const { url } = navState;
    console.log('WebView URL:', url);

    // Check if we've reached the callback URL
    if (url.includes('/aadhaar-callback')) {
      console.log('Callback detected:', url);

      // Extract parameters from URL
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const clientId = urlParams.get('client_id');
      const status = urlParams.get('status');

      if (clientId) {
        // Close WebView and pass data back
        navigation.goBack();
        if (onVerificationComplete) {
          onVerificationComplete(clientId, status);
        }
      }
    }
  };

  const handleError = syntheticEvent => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    Alert.alert(
      'Error',
      'Failed to load verification page. Please try again.',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebView
        ref={webViewRef}
        source={{ uri: verificationUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A6CFF" />
          </View>
        )}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default AadhaarWebView;
