import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/config';

const AuthLoadingScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const determineRoute = async () => {
      let token = null;
      let storedPhoneNumber = null;

      try {
        token = await AsyncStorage.getItem('@user_token');
        storedPhoneNumber = await AsyncStorage.getItem('@user_phone_number');
        console.log("Token", token)
        if (!token || !storedPhoneNumber) {
          console.log('[AuthLoading] No session found. Navigating to Login.');
          navigation.replace('Login');
          return;
        }

        console.log('[AuthLoading] Session found. Checking registration status...');
        console.log('Token', token);

        const statusResponse = await axios.post(
          `${API_URL}/api/auth/check-user-status`,
          { contact_number: storedPhoneNumber },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!statusResponse.data?.success) {
          throw new Error(statusResponse.data?.message || 'Failed to check user status.');
        }

        const isCompleted = statusResponse.data.data.is_completed;

        if (!isCompleted) {
          console.log('[AuthLoading] User registration incomplete. Navigating to Register.');
          navigation.replace('Register');
          return;
        }

        console.log('[AuthLoading] Registration complete. Checking subscription...');

        const subscriptionResponse = await axios.get(
          `${API_URL}/api/plans/subscriptions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!subscriptionResponse.data?.success) {
           throw new Error(subscriptionResponse.data?.message || 'Failed to check subscription status.');
        }

        const activeSubscription = subscriptionResponse.data.data.active_subscription;

        if (!activeSubscription) {
           console.log('[AuthLoading] No active subscription. Navigating to Subscription.');
           navigation.replace('Subscription');
        } else {
           console.log('[AuthLoading] User subscribed. Navigating to Dashboard.');
           navigation.replace('Dashboard');
        }

      } catch (e) {
        console.error('[AuthLoading] Auth check/API call failed:', e.message);
        await AsyncStorage.removeItem('@user_token');
        await AsyncStorage.removeItem('@user_phone_number');
        navigation.replace('Login'); 
      }
    };

    determineRoute();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A6CFF" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#777E90',
  },
});

export default AuthLoadingScreen;