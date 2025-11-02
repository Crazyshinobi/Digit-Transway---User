import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/config';
import Snackbar from '../../components/Snackbar';

// --- Reusable TextInput Component (copied from your other files for consistency) ---
const CustomTextInput = ({ label, value, onChangeText, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholderTextColor="#C7C7CD"
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  </View>
);

const ReferralScreen = () => {
  const navigation = useNavigation();

  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleSubmitReferral = async () => {
    if (!referralCode.trim()) {
      showSnackbar('Please enter a referral ID.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) {
        throw new Error('Session expired. Please log in again.');
      }

      const payload = {
        referral_emp_id: referralCode.trim(),
      };

      const response = await axios.post(
        `${API_URL}/api/auth/update-referral`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        showSnackbar(
          response.data.message || 'Referral code updated successfully!',
          'success',
        );
        // Go back to the previous screen (e.g., Profile or Settings)
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error(
          response.data.message || 'Failed to update referral code.',
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'An error occurred.';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Referral</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.infoText}>
              Know someone who referred you? Enter their employee ID here.
            </Text>

            <CustomTextInput
              label="Employee Referral ID"
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="e.g., EMP00123"
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSubmitReferral}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Submit Referral Code
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
      />
    </SafeAreaView>
  );
};

// --- Styles (using consistent styles from your other files) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  keyboardAvoidingView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { padding: 8, width: 40 },
  headerIcon: { fontSize: 24, color: '#1E2022' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2022',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  infoText: {
    fontSize: 16,
    color: '#777E90',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#1E2022', fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 55,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E2022',
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#4A6CFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
});

export default ReferralScreen;
