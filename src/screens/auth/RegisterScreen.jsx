import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  Linking,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { API_URL } from '../../config/config';
import Snackbar from '../../components/Snackbar';

// --- Reusable Components (Unchanged) ---
const FormSection = ({ title, children }) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <View style={styles.headerDecorator} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const CustomTextInput = ({
  label,
  value,
  onChangeText,
  containerStyle,
  ...props
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.inputWrapper,
        props.editable === false && styles.disabledInputWrapper,
      ]}
    >
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

const CustomDropdown = ({ label, data, value, onChange, placeholder }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      data={data}
      maxHeight={300}
      labelField="label"
      valueField="value"
      placeholder={placeholder || 'Select...'}
      value={value}
      onChange={onChange}
    />
  </View>
);

const countryData = [{ label: 'India', value: 'India' }];

const RegisterScreen = () => {
  const navigation = useNavigation();

  // --- State Management (Optional fields) ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    emergency_contact: '',
    pan_number: '',
    gst_number: '', // NEW FIELD
    full_address: '',
    pincode: '',
    bank_name: '',
    account_number: '',
    ifsc: '',
    gender: 'male',
    state: null,
    city: null,
    country: 'India',
    aadhar_number: '',
  });
  const [isAddressSame, setIsAddressSame] = useState(false);
  const [panImage, setPanImage] = useState(null);
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // --- Bank Verification State ---
  const [bankVerifyLoading, setBankVerifyLoading] = useState(false);
  const [isBankVerified, setIsBankVerified] = useState(false);
  const [verifiedAccountHolder, setVerifiedAccountHolder] = useState('');
  // --- END NEW State ---

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: '',
  });

  // --- UPDATED handleInputChange for PAN, IFSC, GST, and Bank Verification Reset ---
  const handleInputChange = (field, value) => {
    let processedValue = value;

    if (field === 'pan_number') {
      processedValue = value.toUpperCase().slice(0, 10);
    } else if (field === 'ifsc') {
      processedValue = value.toUpperCase().slice(0, 11);
    } else if (field === 'gst_number') {
      processedValue = value.toUpperCase().slice(0, 15);
    }

    // --- Reset bank verification if details change ---
    if (field === 'account_number' || field === 'ifsc') {
      if (isBankVerified) {
        setIsBankVerified(false);
        setVerifiedAccountHolder('');
        setFormData(prev => ({ ...prev, bank_name: '' }));
      }
    }
    // --- END: Reset ---

    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  // --- showSnackbar (Unchanged) ---
  const showSnackbar = (message, type) => {
    setSnackbar({ visible: true, message, type });
    setTimeout(
      () => setSnackbar({ visible: false, message: '', type: '' }),
      3000,
    );
  };

  // --- Pincode Data Fetching (Unchanged) ---
  const fetchLocationData = async pincode => {
    if (!pincode || pincode.length !== 6) return;
    setPincodeLoading(true);
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Session expired. Please log in again.');

      const response = await axios.get(
        `${API_URL}/api/pincode/location?pincode=${pincode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        const { state, city, district } = response.data.data;
        const locationCity = city || district; // Use city, fallback to district
        handleInputChange('state', state || ''); // Set state
        handleInputChange('city', locationCity || ''); // Set city
        showSnackbar('State and City auto-filled.', 'success');
      } else {
        throw new Error(response.data.message || 'Invalid Pincode');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
      handleInputChange('state', null);
      handleInputChange('city', null);
    } finally {
      setPincodeLoading(false);
    }
  };

  // --- UseEffect for Pincode (Unchanged) ---
  useEffect(() => {
    const pincode = formData.pincode;
    if (pincode.length === 0) {
      handleInputChange('state', null);
      handleInputChange('city', null);
    }
    if (pincode.length === 6) {
      fetchLocationData(pincode);
    }
  }, [formData.pincode]);

  // --- Verify Aadhaar Data (Unchanged) ---
  const verifyAadhaarData = async clientId => {
    setAadhaarLoading(true);
    showSnackbar('Verifying Aadhaar data...', 'success');
    try {
      const token = await AsyncStorage.getItem('@user_token');
      const response = await axios.post(
        `${API_URL}/api/auth/aadhaar/verify`,
        { client_id: clientId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        const data = response.data.data;
        setFormData(prev => ({
          ...prev,
          name: data.full_name || prev.name,
          dob: data.dob || prev.dob,
          full_address: data.full_address || prev.full_address,
          pincode: data.zip || prev.pincode,
          state: data.address?.state || prev.state,
          city: data.address?.dist || data.address?.vtc || prev.city,
          gender:
            data.gender === 'M'
              ? 'male'
              : data.gender === 'F'
              ? 'female'
              : 'other',
          aadhar_number: data.masked_aadhaar
            ? data.masked_aadhaar.replace(/X/g, '')
            : prev.aadhar_number,
        }));
        setIsAadhaarVerified(true);
        showSnackbar('Aadhaar Verified & data pre-filled!', 'success');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      showSnackbar(error.message || 'Aadhaar verification failed.', 'error');
    } finally {
      setAadhaarLoading(false);
    }
  };

  // --- Aadhaar Initialization (Unchanged) ---
  const handleAadhaarVerification = async () => {
    setAadhaarLoading(true);
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) {
        showSnackbar('Session not found...', 'error');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/auth/aadhaar/initialize`,
        {
          redirect_url: 'https://digittransway.in/aadhaar-callback.php',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success && response.data.data.verification_url) {
        const verificationUrl = response.data.data.verification_url;

        // Open WebView instead of external browser
        navigation.navigate('AadhaarWebView', {
          verificationUrl,
          onVerificationComplete: async (clientId, status) => {
            console.log('Verification complete:', clientId, status);
            await verifyAadhaarData(clientId);
          },
        });
      } else {
        throw new Error(
          response.data.message || 'Failed to initialize Aadhaar.',
        );
      }
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || 'An error occurred.',
        'error',
      );
    } finally {
      setAadhaarLoading(false);
    }
  };

  // --- File Picker functions (Unchanged) ---
  const imagePickerOptions = {
    mediaType: 'photo',
    includeBase64: false,
    maxHeight: 2000,
    maxWidth: 2000,
    quality: 0.8,
  };

  const handleImagePickerResult = (result, setFile) => {
    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.errorCode) {
      showSnackbar('Error picking image: ' + result.errorMessage, 'error');
    } else if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.fileName || `document_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
      showSnackbar('File selected successfully', 'success');
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        showSnackbar('Camera permission denied.', 'error');
        return false;
      }
    } catch (err) {
      console.warn(err);
      showSnackbar('Error requesting camera permission.', 'error');
      return false;
    }
  };

  const openCamera = async setFile => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }
    try {
      const result = await launchCamera(imagePickerOptions);
      handleImagePickerResult(result, setFile);
    } catch (err) {
      console.error('Camera error:', err);
      showSnackbar('Failed to open camera.', 'error');
    }
  };

  const openGallery = async setFile => {
    try {
      const result = await launchImageLibrary(imagePickerOptions);
      handleImagePickerResult(result, setFile);
    } catch (err) {
      console.error('Gallery picker error:', err);
      showSnackbar('Failed to open gallery.', 'error');
    }
  };

  const handleFilePick = async setFile => {
    Alert.alert(
      'Select Document Source',
      'Choose an option:',
      [
        {
          text: 'Open Camera',
          onPress: () => openCamera(setFile),
        },
        {
          text: 'Open Gallery',
          onPress: () => openGallery(setFile),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  // --- Bank Verification Function (Unchanged) ---
  const handleBankVerification = async () => {
    // Client-side validation: must have account/ifsc if they press the button
    if (!formData.account_number || !formData.ifsc) {
      showSnackbar('Please enter Account Number and IFSC code.', 'error');
      return;
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (formData.ifsc.length !== 11 || !ifscRegex.test(formData.ifsc)) {
      showSnackbar('Please enter a valid 11-digit IFSC code.', 'error');
      return;
    }

    setBankVerifyLoading(true);
    setIsBankVerified(false);
    setVerifiedAccountHolder('');

    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Session expired. Please log in again.');

      const response = await axios.post(
        `${API_URL}/api/vendor/auth/verify-bank-account`,
        {
          account_number: formData.account_number,
          ifsc: formData.ifsc,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success && response.data.verified) {
        const data = response.data.data;
        setIsBankVerified(true);
        setVerifiedAccountHolder(data.account_holder_name);
        handleInputChange('bank_name', data.bank_details.bank_name);
        showSnackbar('Bank account verified successfully!', 'success');
      } else {
        throw new Error(
          response.data.message || 'Bank account verification failed.',
        );
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
      setIsBankVerified(false);
      setVerifiedAccountHolder('');
      handleInputChange('bank_name', '');
    } finally {
      setBankVerifyLoading(false);
    }
  };

  // --- UPDATED Handle Final Registration (Bank/Document checks removed) ---
  const handleRegistration = async () => {
    // --- REQUIRED VALIDATION CHECKS ---

    // 1. Aadhaar Verification is the ONLY strictly REQUIRED step
    if (!isAadhaarVerified) {
      showSnackbar('Aadhaar verification is required to register.', 'error');
      return;
    }

    // 2. PAN Validation (if entered)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.pan_number.length > 0 && !panRegex.test(formData.pan_number)) {
      showSnackbar(
        'If entered, PAN must be in a valid format (e.g., ABCDE1234F).',
        'error',
      );
      return;
    }

    // 3. Pincode and Location Check (If pincode is entered, city/state must be filled)
    if (formData.pincode.length === 6 && (!formData.state || !formData.city)) {
      showSnackbar(
        'Pincode lookup failed. Please re-enter a valid PIN code or clear the field.',
        'error',
      );
      return;
    }

    // NOTE: isBankVerified and document uploads (panImage, aadhaarFront, aadhaarBack) are now OPTIONAL.

    setRegistrationLoading(true);
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Session expired. Please log in again.');

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        // Only append fields that are not null or undefined
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      data.append('same_address', isAddressSame ? 'true' : 'false');
      data.append('declaration', 'true');

      // Documents are appended IF they exist
      if (panImage) data.append('pan_image', panImage);
      if (aadhaarFront) data.append('aadhar_front', aadhaarFront);
      if (aadhaarBack) data.append('aadhar_back', aadhaarBack);

      console.log('--- Submitting Registration FormData ---');
      data._parts.forEach(part => {
        // Logging sensitive data for debug purposes is fine in this context, but note the data type
        const value =
          typeof part[1] === 'object' && part[1] !== null
            ? part[1].name
            : part[1];
        console.log(part[0], ':', value);
      });
      console.log('------------------------------------');

      const response = await axios.post(
        `${API_URL}/api/auth/complete-registration`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        showSnackbar('Registration successful! Redirecting...', 'success');
        setTimeout(() => navigation.replace('Subscription'), 1500);
      } else {
        throw new Error(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(
        'Registration error:',
        err.response?.data || err.message || err,
      );
      const errorMessage =
        err.response?.data?.message || err.message || 'An error occurred.';
      showSnackbar(errorMessage, 'error');
    } finally {
      setRegistrationLoading(false);
    }
  };

  // --- Render Method (UPDATED with optional labels) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Registration</Text>
        <TouchableOpacity onPress={handleRegistration}>
          <Text style={styles.headerSave}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* AADHAAR Section (Aadhaar Verification is now CRITICAL) */}
          <FormSection title="AADHAAR VERIFICATION (Required)">
            {isAadhaarVerified ? (
              <View style={styles.verifiedBox}>
                <Text style={styles.verifiedText}>
                  ✅ Aadhaar Verified Successfully
                </Text>
                <Text style={styles.verifiedTextHint}>
                  (Registration will only proceed with successful Aadhaar
                  verification)
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Verify your Aadhaar to auto-fill your details securely.
                    **(Required for Registration)**
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    aadhaarLoading && styles.disabledButton,
                  ]}
                  onPress={handleAadhaarVerification}
                  disabled={aadhaarLoading}
                >
                  {aadhaarLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Verify with Aadhaar
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </FormSection>

          {/* BASIC DETAILS Section (Fields are now OPTIONAL) */}
          <FormSection title="BASIC DETAILS (Optional)">
            <CustomTextInput
              label="Full Name"
              value={formData.name}
              onChangeText={val => handleInputChange('name', val)}
              placeholder="Enter your full name"
            />
            <CustomTextInput
              label="Email Address"
              value={formData.email}
              onChangeText={val => handleInputChange('email', val)}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <CustomTextInput
              label="Date of Birth (YYYY-MM-DD)"
              value={formData.dob}
              onChangeText={val => handleInputChange('dob', val)}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.label}>Select Gender</Text>
            <View style={styles.genderSelector}>
              {['male', 'female', 'other'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    formData.gender === option && styles.genderOptionSelected,
                  ]}
                  onPress={() => handleInputChange('gender', option)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formData.gender === option && styles.radioCircleSelected,
                    ]}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === option && styles.genderTextSelected,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <CustomTextInput
              label="Emergency Contact Number"
              value={formData.emergency_contact}
              onChangeText={val => handleInputChange('emergency_contact', val)}
              placeholder="Enter 10 digit number"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </FormSection>

          {/* DOCUMENTS Section (Documents are now OPTIONAL) */}
          <FormSection title="DOCUMENTS & IDS (Optional)">
            <CustomTextInput
              label="Aadhaar Number"
              value={formData.aadhar_number}
              onChangeText={val => handleInputChange('aadhar_number', val)}
              placeholder="Enter Aadhaar Number"
              keyboardType="number-pad"
              maxLength={12}
            />
            <Text style={styles.label}>Aadhaar Front</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleFilePick(setAadhaarFront)}
            >
              <Text
                style={styles.uploadText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {aadhaarFront
                  ? aadhaarFront.name
                  : '📎 Click to Upload Aadhaar Front (Optional)'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.label, { marginTop: 16 }]}>Aadhaar Back</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleFilePick(setAadhaarBack)}
            >
              <Text
                style={styles.uploadText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {aadhaarBack
                  ? aadhaarBack.name
                  : '📎 Click to Upload Aadhaar Back (Optional)'}
              </Text>
            </TouchableOpacity>
            <CustomTextInput
              label="PAN Number"
              value={formData.pan_number}
              onChangeText={val => handleInputChange('pan_number', val)}
              placeholder="Enter PAN number"
              maxLength={10}
              autoCapitalize="characters"
            />
            <Text style={styles.label}>PAN Card</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleFilePick(setPanImage)}
            >
              <Text
                style={styles.uploadText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {panImage
                  ? panImage.name
                  : '📎 Click to Upload PAN Card (Optional)'}
              </Text>
            </TouchableOpacity>
            {/* GST Input */}
            <CustomTextInput
              label="GST Number"
              value={formData.gst_number}
              onChangeText={val => handleInputChange('gst_number', val)}
              placeholder="Enter GST number (Optional)"
              maxLength={15}
              autoCapitalize="characters"
            />
            {/* End GST Input */}
          </FormSection>

          {/* ADDRESS DETAILS Section (Fields are now OPTIONAL) */}
          <FormSection title="ADDRESS DETAILS (Optional)">
            <CustomTextInput
              label="Full Address"
              value={formData.full_address}
              onChangeText={val => handleInputChange('full_address', val)}
              placeholder="Enter complete address"
              multiline
            />
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <CustomTextInput
                  label="State"
                  value={formData.state || ''}
                  placeholder="Auto-filled from PIN"
                  editable={false}
                />
              </View>
              <View style={styles.halfWidth}>
                <CustomTextInput
                  label="City"
                  value={formData.city || ''}
                  placeholder="Auto-filled from PIN"
                  editable={false}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View>
                  <CustomTextInput
                    label="PIN Code"
                    value={formData.pincode}
                    onChangeText={val =>
                      handleInputChange('pincode', val.replace(/[^0-9]/g, ''))
                    }
                    placeholder="Enter 6-digit PIN"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {pincodeLoading && (
                    <ActivityIndicator
                      style={styles.pincodeSpinner}
                      color="#4A6CFF"
                    />
                  )}
                </View>
              </View>
              <View style={styles.halfWidth}>
                <CustomDropdown
                  label="Country"
                  data={countryData}
                  placeholder="Select Country"
                  value={formData.country}
                  onChange={item => handleInputChange('country', item.value)}
                />
              </View>
            </View>
            <View style={styles.checkboxContainer}>
              <Switch
                trackColor={{ false: '#E0E0E0', true: '#4A6CFF' }}
                thumbColor={'#FFFFFF'}
                onValueChange={() => setIsAddressSame(prev => !prev)}
                value={isAddressSame}
              />
              <Text style={styles.checkboxLabel}>
                Permanent address same as current address
              </Text>
            </View>
          </FormSection>

          {/* BANK DETAILS Section (Verification is now OPTIONAL) */}
          <FormSection title="BANK DETAILS (Optional)">
            <CustomTextInput
              label="Bank Name"
              value={formData.bank_name}
              onChangeText={val => handleInputChange('bank_name', val)}
              placeholder="Bank Name (Manual/Auto-filled)"
              // Removed editable={false} to allow manual entry if verification isn't used
            />
            <CustomTextInput
              label="Account Number"
              value={formData.account_number}
              onChangeText={val => handleInputChange('account_number', val)}
              placeholder="Enter account number"
              keyboardType="number-pad"
            />

            {/* IFSC Input + Verify Button */}
            <View style={styles.inputWithButtonContainer}>
              <CustomTextInput
                label="IFSC Code"
                value={formData.ifsc}
                onChangeText={val => handleInputChange('ifsc', val)}
                placeholder="Enter IFSC code"
                maxLength={11}
                autoCapitalize="characters"
                containerStyle={{ flex: 1, marginBottom: 0 }}
              />
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  bankVerifyLoading && styles.disabledButton,
                ]}
                onPress={handleBankVerification}
                disabled={bankVerifyLoading}
              >
                {bankVerifyLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
            {/* End: IFSC Input + Verify Button */}

            {/* Verified Holder Name Display */}
            {isBankVerified && (
              <View style={styles.verifiedBankBox}>
                <Text style={styles.verifiedBankText}>
                  ✓ Verified as: {verifiedAccountHolder}
                </Text>
              </View>
            )}
            {/* End: Verified Holder Name Display */}
          </FormSection>

          {/* Submit Button (Unchanged) */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { marginTop: 20, marginBottom: 40 },
              registrationLoading && styles.disabledButton,
            ]}
            onPress={handleRegistration}
            disabled={registrationLoading}
          >
            {registrationLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Complete Registration
              </Text>
            )}
          </TouchableOpacity>
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

// --- Styles (Unchanged) ---
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
  backButton: { padding: 8 },
  headerIcon: { fontSize: 24, color: '#1E2022' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2022',
    flex: 1,
    textAlign: 'center',
  },
  headerSave: { fontSize: 16, color: '#4A6CFF', fontWeight: '600' },
  scrollContainer: { padding: 16 },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerDecorator: {
    width: 4,
    height: 16,
    backgroundColor: '#4A6CFF',
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A6CFF',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9EFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, color: '#4A6CFF', fontSize: 14 },
  primaryButton: {
    backgroundColor: '#4A6CFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabledButton: { backgroundColor: '#A0B2FF' },
  inputContainer: { marginBottom: 16 },
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
  disabledInputWrapper: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E2022',
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  genderOptionSelected: { backgroundColor: '#E9EFFF', borderColor: '#4A6CFF' },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CD',
    marginRight: 8,
  },
  radioCircleSelected: { borderColor: '#4A6CFF', backgroundColor: '#4A6CFF' },
  genderText: { fontSize: 16, color: '#1E2022' },
  genderTextSelected: { fontWeight: '600' },
  uploadBox: {
    minHeight: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  uploadText: { color: '#8A8A8E', fontSize: 14, flex: 1, textAlign: 'center' },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxLabel: { marginLeft: 8, fontSize: 14, color: '#1E2022', flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  dropdown: {
    minHeight: 55,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  placeholderStyle: { fontSize: 16, color: '#C7C7CD' },
  selectedTextStyle: { fontSize: 16, color: '#1E2022' },
  verifiedBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
  verifiedTextHint: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
  },
  pincodeSpinner: {
    position: 'absolute',
    right: 16,
    top: 48,
  },
  inputWithButtonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#4A6CFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginLeft: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBankBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedBankText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RegisterScreen;
