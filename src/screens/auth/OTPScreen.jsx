import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions, // Keep this for responsiveness
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/config';
import Snackbar from '../../components/Snackbar';

const OTP_LENGTH = 4;

const OTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber } = route.params;
  const { height } = useWindowDimensions(); // Used for responsive layout calculations if needed

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: '',
  });

  const showSnackbar = (message, type) => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => {
      setSnackbar({ visible: false, message: '', type: '' });
    }, 3000);
  };

  const handleKeyPress = key => {
    if (otpError) setOtpError(false); // Clear error style on new input

    if (key === 'backspace') {
      setOtp(prevOtp => prevOtp.slice(0, -1));
    } else if (otp.length < OTP_LENGTH) {
      setOtp(prevOtp => prevOtp + key);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) return;

    setLoading(true);
    setOtpError(false);

    try {
      // Call verify-otp endpoint (no token needed for this call)
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        contact_number: phoneNumber,
        otp: otp,
      });

      if (response.data.success) {
        // Verification successful, get the final token
        const accessToken = response.data.data.access_token;
        const userId = response.data.data.user.id
        if (accessToken) {
          // Save the final token and the phone number
          await AsyncStorage.setItem('@user_token', accessToken);
          await AsyncStorage.setItem('@user_phone_number', phoneNumber);
          await AsyncStorage.setItem('@user_id', userId.toString());
          console.log('Access Token and phone number saved successfully!');

          showSnackbar('Phone number verified successfully!', 'success');
          // Navigate to the next step (Registration) after a delay
          setTimeout(() => {
            navigation.replace('AuthLoading'); // Use replace to prevent going back to OTP
          }, 1000);
        } else {
          // Handle API success but missing token
          throw new Error(
            'Verification successful but no access token was provided.',
          );
        }
      } else {
        // API returned success: false (e.g., invalid OTP)
        setOtpError(true);
        showSnackbar(
          response.data.message || 'Invalid OTP. Please try again.',
          'error',
        );
      }
    } catch (err) {
      // Handle network errors or other exceptions
      setOtpError(true);
      const errorMessage =
        err.response?.data?.message || 'An error occurred during verification.';
      showSnackbar(errorMessage, 'error');
      console.error('[Verify OTP Error]', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to render the OTP input boxes
  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < OTP_LENGTH; i++) {
      const digit = otp[i] || '';
      const isFocused = i === otp.length && !loading; // Highlight the next box to fill
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFocused && styles.otpBoxFocused, // Apply focus style
            otpError && styles.otpBoxError, // Apply error style
          ]}
        >
          <Text style={styles.otpText}>{digit}</Text>
        </View>,
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.topContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')} // Go back to Login
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verify Phone Number</Text>
            <Text style={styles.subtitle}>
              Please enter the {OTP_LENGTH} digit code sent to{' '}
              <Text style={{ fontWeight: 'bold' }}>+91{phoneNumber}</Text> through SMS
            </Text>
            {/* Link to go back and edit the number */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Edit your phone number?</Text>
            </TouchableOpacity>
          </View>

          {/* Render the OTP boxes */}
          <View style={styles.otpContainer}>{renderOtpBoxes()}</View>

          {/* Footer section with Resend and Verify button */}
          <View style={styles.footerContainer}>
            <Text style={styles.resendText}>
              Haven't got the confirmation code yet?{' '}
              <Text style={styles.linkText}>Resend</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                // Disable button if OTP is incomplete or loading
                (otp.length < OTP_LENGTH || loading) && styles.disabledButton,
              ]}
              disabled={otp.length < OTP_LENGTH || loading}
              onPress={handleVerifyOtp} // Trigger verification on press
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" /> // Show spinner when loading
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Number Pad */}
        <View style={styles.keypadContainer}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'backspace'], // Layout for the keypad rows
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map(key => (
                <TouchableOpacity
                  key={key}
                  style={styles.keypadKey}
                  onPress={() => handleKeyPress(key)} // Handle input on press
                  disabled={key === ''} // Disable the empty space
                >
                  {key === 'backspace' ? (
                    <Text style={styles.keypadKeyText}>⌫</Text> // Backspace icon
                  ) : (
                    <Text style={styles.keypadKeyText}>{key}</Text> // Digit
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {/* Snackbar for showing messages */}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1, // Ensures content can scroll if needed, takes minimum space required
  },
  topContent: {
    flex: 1, // Takes available vertical space, pushing keypad down
    paddingHorizontal: 20,
  },
  backButton: {
    paddingVertical: 20, // More touch area
    paddingRight: 20, // Ensure touch area doesn't cover whole width
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 24,
    color: '#1E2022',
  },
  headerContainer: {
    // Styles for the text content area
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#777E90',
    marginBottom: 12,
    lineHeight: 22,
  },
  linkText: {
    color: '#4A6CFF',
    fontSize: 15,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute boxes evenly
    marginVertical: 40,
  },
  otpBox: {
    width: '22%', // Flexible width based on container
    aspectRatio: 1, // Keep it square
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: '#4A6CFF', // Blue border when focused
  },
  otpBoxError: {
    borderColor: '#D92D20', // Red border on error
  },
  otpText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2022',
  },
  footerContainer: {
    flex: 1, // Takes remaining space in topContent
    justifyContent: 'flex-end', // Pushes content to the bottom
    paddingBottom: 20, // Space above the keypad
  },
  resendText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#777E90',
    marginBottom: 20, // Space before button
  },
  verifyButton: {
    backgroundColor: '#4A6CFF',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#A0B2FF', // Lighter color when disabled
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  keypadContainer: {
    paddingHorizontal: 20, // Consistent padding
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Adjust padding for different OS
    paddingTop: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space keys evenly
    marginBottom: Platform.OS === 'ios' ? 15 : 10, // Adjust spacing
  },
  keypadKey: {
    width: '30%', // Flexible width
    minHeight: 60, // Minimum height for touchability
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // Optional: slightly rounded keys
  },
  keypadKeyText: {
    fontSize: 32,
    color: '#1E2022',
  },
});

export default OTPScreen;