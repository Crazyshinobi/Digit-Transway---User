import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../../config/config';
import Snackbar from '../../components/Snackbar';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: '',
  });

  const showSnackbar = (message, type) => {
    setSnackbar({ visible: true, message, type });
    setTimeout(
      () => setSnackbar({ visible: false, message: '', type: '' }),
      3000,
    );
  };

  const handleLogin = async () => {
    setError('');
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/send-otp`, {
        contact_number: phoneNumber,
      });

      if (response?.data?.success) {
        showSnackbar('OTP sent successfully!', 'success');
        setTimeout(() => {
          navigation.navigate('OTP', { phoneNumber: phoneNumber });
          setLoading(false);
        }, 1000);
      } else {
        const errorMessage =
          response?.data?.message || 'Failed to send OTP. Please try again.';
        showSnackbar(errorMessage, 'error');
        setLoading(false);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'An unexpected error occurred.';
      showSnackbar(errorMessage, 'error');
      setLoading(false);
      console.error('[Login Error]', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Welcome')}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Enter Phone number for verification</Text>
        <Text style={styles.subtitle}>
          We'll text a code to verify your phone number
        </Text>
        <View style={styles.inputRow}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <TextInput
            style={[styles.textInput, error ? styles.inputError : null]}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={text => {
              setPhoneNumber(text);
              if (error) setError('');
            }}
            maxLength={10}
            placeholder="Enter your phone number"
            placeholderTextColor="#C7C7CD"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.noteText}>
          Note: By proceeding, you consent to get calls, WhatsApp or SMS
          messages...
        </Text>
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Get Verification Code</Text>
          )}
        </TouchableOpacity>
      </View>
      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
      />
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backButton: { padding: 20, alignSelf: 'flex-start' },
  backArrow: { fontSize: 24, color: '#1E2022' },
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: '#777E90', marginBottom: 30 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  countryCodeText: { fontSize: 16, color: '#1E2022' },
  textInput: {
    flex: 1,
    height: 55,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 20,
    marginLeft: 10,
    fontSize: 16,
    color: '#1E2022',
  },
  inputError: { borderColor: '#D92D20' },
  errorText: {
    color: '#D92D20',
    fontSize: 12,
    marginLeft: 110,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    color: '#777E90',
    lineHeight: 18,
    marginBottom: 30,
  },
  verifyButton: {
    backgroundColor: '#4A6CFF',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: { backgroundColor: '#A0B2FF' },
  verifyButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});

export default LoginScreen;
