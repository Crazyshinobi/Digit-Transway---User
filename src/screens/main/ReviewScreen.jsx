import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/config'; // Adjust path if necessary
import { PAYMENT_TEST_URL } from '../../config/config'; // Adjust path if necessary
import Snackbar from '../../components/Snackbar';

const ReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Extract data passed from MyTripsScreen
  const { bookingId, vendorId } = route.params || {};

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true); // 👈 New state for loading check

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

  // --- Initialization and User ID Check ---
  useEffect(() => {
    const getUserId = async () => {
      // 1. FIX: Retrieve the ID using the correct key: '@user_id'
      const storedUserId = await AsyncStorage.getItem('@user_id');
      console.log('user id', storedUserId);
      if (storedUserId) {
        // 2. Parse the stored ID (which should be a string from AsyncStorage)
        setUserId(parseInt(storedUserId, 10));
      } else {
        // 3. Handle case where user ID is missing (not logged in)
        showSnackbar('User session not found. Please log in.', 'error');
        setTimeout(() => navigation.goBack(), 1000);
      }

      // 4. Also check for missing trip details passed via navigation
      if (!bookingId || !vendorId) {
        showSnackbar('Missing trip details. Cannot add review.', 'error');
        setTimeout(() => navigation.goBack(), 1000);
      }

      // 5. Done checking, allow rendering
      setInitialLoading(false);
    };
    getUserId();
  }, [navigation, bookingId, vendorId]);

  // Function to handle star press
  const handleRating = newRating => {
    setRating(newRating);
  };

  // Renders the star icons
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleRating(i)}
          style={styles.starButton}
        >
          <Icon
            name={i <= rating ? 'star' : 'star-border'}
            size={40}
            color={i <= rating ? '#FFC107' : '#E0E0E0'}
          />
        </TouchableOpacity>,
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      return Alert.alert('Required', 'Please give a rating before submitting.');
    }
    // Final check for all required data
    if (!userId || !bookingId || !vendorId) {
      return Alert.alert(
        'Error',
        'Required information is missing. Cannot submit review.',
      );
    }

    setLoading(true);
    try {
      // Retrieve the token for the API header
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Authentication token not found.');

      // Inside handleSubmitReview:
      console.log('--- Submission Debugging ---');
      console.log('userId:', userId, 'Type:', typeof userId);
      console.log('bookingId:', bookingId, 'Type:', typeof bookingId);
      console.log('rating:', rating, 'Type:', typeof rating);
      console.log('vendorId:', vendorId, 'Type:', typeof vendorId);
      console.log('----------------------------');
      // ... rest of the function

      const reviewPayload = {
        booking_id: bookingId,
        user_id: userId, // Use the correctly retrieved integer ID
        vendor_id: vendorId,
        rating: rating,
        comment: comment.trim(),
      };

      const response = await axios.post(
        `${PAYMENT_TEST_URL}/api/add-review`,
        reviewPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.status) {
        showSnackbar('Review added successfully!', 'success');
        // Navigate back after successful submission
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        const message = response.data.message || 'Failed to submit review.';
        throw new Error(message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred.';
      showSnackbar(errorMessage, 'error');
      console.error('Review submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Conditional Rendering for Loading State ---
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4A6CFF" />
        <Text style={{ marginTop: 10, color: '#777E90' }}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerTitle}>Rate Your Trip</Text>
          <Text style={styles.subtitle}>
            Booking ID: **#{bookingId}** | Vendor ID: **#{vendorId}**
          </Text>

          {/* --- Rating Input --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              1. Overall Rating ({rating} / 5)
            </Text>
            {renderStars()}
          </View>

          {/* --- Comment Input --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Add Comments (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Tell us about your experience..."
              value={comment}
              onChangeText={setComment}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </ScrollView>

        {/* --- Submission Button --- */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitReview}
            disabled={loading || rating === 0}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  centered: {
    // For initial loading state
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#777E90',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2022',
    marginBottom: 15,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    paddingHorizontal: 5,
  },
  commentInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1E2022',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#4A6CFF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A0B4FF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReviewScreen;
