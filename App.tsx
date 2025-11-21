import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthLoadingScreen from "./src/screens/auth/AuthLoadingScreen"
import WelcomeScreen from "./src/screens/main/WelcomeScreen"
import LoginScreen from "./src/screens/auth/LoginScreen"
import OTPScreen from "./src/screens/auth/OTPScreen"
import RegisterScreen from "./src/screens/auth/RegisterScreen"
import DashboardScreen from "./src/screens/main/DashboardScreen"
import HomeScreen from "./src/screens/tabs/HomeScreen"
import SubscriptionScreen from "./src/screens/main/SubscriptionScreen"
import NewBookingScreen from './src/screens/main/NewBookingScreen';
import ReferralScreen from './src/screens/main/ReferralScreen';
import MySubscriptionScreen from './src/screens/main/MySubscriptionScreen';
import ReviewScreen from './src/screens/main/ReviewScreen';
import AadhaarWebView from './src/screens/auth/AadhaarWebView';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#333' : '#F7F8FA',
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="AuthLoading" // Start with the loading screen
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="NewBooking" component={NewBookingScreen} />
          <Stack.Screen name="Referral" component={ReferralScreen} />
          <Stack.Screen name="MySubscription" component={MySubscriptionScreen} />
          <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
          <Stack.Screen
            name="AadhaarWebView"
            component={AadhaarWebView}
            options={{
              title: 'Aadhaar Verification',
              headerShown: true,
              headerBackTitle: 'Cancel',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;