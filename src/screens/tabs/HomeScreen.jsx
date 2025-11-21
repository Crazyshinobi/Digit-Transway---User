import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Snackbar from '../../components/Snackbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import truckhero from '../../assets/images/tuckhero.jpg';

const HomeScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: '',
  });

  // ------------------------------------------------------------------
  // 🚀 FIXED FUNCTION: Use Nested Navigation Syntax without redundant params
  // ------------------------------------------------------------------
  const goToMyTripsTab = tabName => {
    navigation.navigate(
      'My Trips', // 1. Bottom Tab name
      {
        screen: tabName, // 2. Top Tab Screen name (e.g., 'CancelledBookings')
      },
    );
  };
  // ------------------------------------------------------------------

  const showSnackbar = (message, type) => {
    setSnackbar({ visible: true, message, type });
    setTimeout(
      () => setSnackbar({ visible: false, message: '', type: '' }),
      3000,
    );
  };

  const fetchBookingSummary = async () => {
    // ... (existing fetch logic)
    setError('');
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Authentication token not found.');

      const response = await axios.get(
        `${API_URL}/api/truck-booking/my-bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setSummary(response.data.data.summary);
      } else {
        throw new Error(
          response.data.message || 'Failed to fetch booking summary.',
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Error fetching summary.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      console.error('[Fetch Summary Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchBookingSummary();
    }
  }, [isFocused]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchBookingSummary();
  }, []);

  // ------------------------------------------------------------------
  // 🔄 MODIFIED: renderSummaryCard remains the same
  // ------------------------------------------------------------------
  const renderSummaryCard = (label, count, iconName, color, tabRouteName) => (
    <TouchableOpacity // 👈 Wrap the card in TouchableOpacity
      style={styles.summaryCardTouchable}
      onPress={() => goToMyTripsTab(tabRouteName)}
      disabled={count === 0 && label !== 'Pending'} // Optionally disable if count is 0
    >
      <View style={styles.summaryCard}>
        <Icon name={iconName} size={30} color={color} />
        <Text style={styles.summaryCount}>{count ?? '0'}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
  // ------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A6CFF']}
          />
        }
      >
        {/* --- WELCOME HEADER --- */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Check out your trip statistics.
          </Text>
        </View>

        {loading && !refreshing && (
          <ActivityIndicator
            size="large"
            color="#4A6CFF"
            style={{ marginTop: 50 }}
          />
        )}

        {error && !loading && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}

        {/* --- SUMMARY CARDS (Mapping status to Top Tab Route Names) --- */}
        {!loading && !error && summary && (
          <View style={styles.summaryGrid}>
            {/* Map 'Pending' to 'PendingBookings' tab */}
            {renderSummaryCard(
              'Pending',
              summary.pending_count,
              'hourglass-empty',
              '#FFA000',
              'PendingBookings', // 👈 Top Tab Route Name
            )}
            {/* Map 'Active' to 'ActiveBookings' tab */}
            {renderSummaryCard(
              'Active',
              summary.active_count,
              'local-shipping',
              '#1976D2',
              'ActiveBookings', // 👈 Top Tab Route Name
            )}
            {/* Map 'Completed' to 'CompletedBookings' tab */}
            {renderSummaryCard(
              'Completed',
              summary.completed_count,
              'check-circle',
              '#388E3C',
              'CompletedBookings', // 👈 Top Tab Route Name
            )}
            {/* Map 'Cancelled' to 'CancelledBookings' tab */}
            {renderSummaryCard(
              'Cancelled',
              summary.cancelled_count,
              'cancel',
              '#D32F2F',
              'CancelledBookings', // 👈 Top Tab Route Name
            )}
          </View>
        )}

        {/* --- BOOK BUTTON (Unchanged) --- */}
        {!loading && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate('NewBooking')}
          >
            <Icon
              name="add-circle-outline"
              size={24}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.bookButtonText}>Book a New Truck</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  // --- NEW WELCOME STYLES ---
  welcomeContainer: {
    marginBottom: 24,
    alignItems: 'center', // Fix for 'flex-center'
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E2022',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#777E90',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15, // Reduced margin
  },
  summaryCardTouchable: {
    width: '48%',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2022',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#777E90',
    marginTop: 4,
  },
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    overflow: 'hidden', // Keeps image corners rounded
  },
  promoImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E0E0E0', // Placeholder color
  },
  promoTextContainer: {
    padding: 16,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2022',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  // --- END NEW STYLES ---
  bookButton: {
    backgroundColor: '#4A6CFF',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 50,
    textAlign: 'center',
    color: '#D32F2F',
    fontSize: 16,
  },
    summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  // 👈 NEW STYLE: Touchable wrapper for layout
  summaryCardTouchable: {
    width: '48%',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    // width: '100%', // Removed since parent handles width
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default HomeScreen;



