import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/config'; // Adjust path if needed
import Snackbar from '../../components/Snackbar'; // Adjust path if needed
import Icon from 'react-native-vector-icons/MaterialIcons'; // For icons

const MySubscriptionScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      setError(null);
      setSubscription(null); // Clear old data on refresh
      try {
        const token = await AsyncStorage.getItem('@user_token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }

        const response = await axios.get(`${API_URL}/api/plans/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('My Subscription Response:', response.data);

        if (response.data.success) {
          // Set the active_subscription object directly
          setSubscription(response.data.data.active_subscription || null);
        } else {
          throw new Error(
            response.data.message || 'Failed to fetch subscription.',
          );
        }
      } catch (err) {
        console.error(
          '[Fetch Subscription Error]',
          err.response?.data || err.message || err,
        );
        const errorMessage =
          err.response?.data?.message || err.message || 'An error occurred.';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchSubscription();
    }
  }, [isFocused]);

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      // Format to "24 Oct 2025"
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDuration = durationType => {
    if (!durationType) return '';
    if (durationType.toLowerCase() === 'monthly') return '/ month';
    if (durationType.toLowerCase() === 'yearly') return '/ year';
    return `/ ${durationType}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4A6CFF" />
          <Text style={styles.loadingText}>Loading your subscription...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!subscription) {
      return (
        <View style={styles.centered}>
          <Icon name="subscriptions" size={60} color="#C7C7CD" />
          <Text style={styles.noSubText}>No Active Subscription</Text>
          <Text style={styles.noSubHelperText}>
            You do not have an active plan. Browse our plans to get started.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Subscription')} // Navigate to SubscriptionScreen
          >
            <Text style={styles.browseButtonText}>Browse Plans</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // --- If subscription exists, show details ---
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.planCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.planName}>{subscription.plan_name}</Text>
            {subscription.status && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      subscription.status === 'active' ? '#E8F5E9' : '#FFEBEE',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        subscription.status === 'active'
                          ? '#4CAF50'
                          : '#D92D20',
                    },
                  ]}
                >
                  {subscription.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>₹{subscription.price_paid}</Text>
            <Text style={styles.planDuration}>
              {formatDuration(subscription.duration_type)}
            </Text>
          </View>

          {/* New Days Remaining Block */}
          <View style={styles.daysRemainingContainer}>
            <Text style={styles.daysRemainingValue}>
              {Math.round(subscription.days_remaining)}
            </Text>
            <Text style={styles.daysRemainingLabel}>Days Remaining</Text>
          </View>

          {/* Subscription Date Details */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Activated On</Text>
            <Text style={styles.detailValue}>
              {formatDate(subscription.starts_at)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expires On</Text>
            <Text style={styles.detailValue}>
              {formatDate(subscription.expires_at)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subscribed On</Text>
            <Text style={styles.detailValue}>
              {formatDate(subscription.subscribed_at)}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
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
        <Text style={styles.headerTitle}>My Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderContent()}

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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F8FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#777E90',
  },
  errorText: {
    fontSize: 16,
    color: '#D92D20',
    textAlign: 'center',
  },
  noSubText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2022',
    marginTop: 16,
  },
  noSubHelperText: {
    fontSize: 14,
    color: '#777E90',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#4A6CFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E2022',
    flex: 1, // Allow name to wrap
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E2022',
  },
  planDuration: {
    fontSize: 14,
    color: '#777E90',
    marginLeft: 4,
  },
  // New styles for Days Remaining
  daysRemainingContainer: {
    backgroundColor: '#E9EFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  daysRemainingValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A6CFF',
  },
  daysRemainingLabel: {
    fontSize: 14,
    color: '#4A6CFF',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777E90',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E2022',
    fontWeight: '500',
  },
});

export default MySubscriptionScreen;
