import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Snackbar from '../../components/Snackbar';

// Helper function to format the material and weight
const formatMaterial = item => {
  const material = item.material?.name || 'N/A';
  const weight =
    item.material?.weight || item.material?.weight_value
      ? `${item.material?.weight || item.material.weight_value} tons`
      : 'N/A';
  return `${material} (${weight})`;
};

// Helper function to get the correct pickup date/time string
const getPickupDate = item => {
  // Check if pickup_formatted is available in schedule (for pending/active)
  if (item.schedule?.pickup_formatted) {
    return item.schedule.pickup_formatted;
  }
  // Check if pickup_scheduled is available in timeline (for completed)
  if (item.timeline?.pickup_scheduled?.formatted) {
    return item.timeline.pickup_scheduled.formatted;
  }
  // Fallback to the old date format if necessary
  return item.pickup_datetime
    ? new Date(item.pickup_datetime).toLocaleDateString()
    : 'N/A';
};

const BookingItem = ({ item, navigation }) => {
  // Determine the status text to display
  const statusText =
    item.status_label || item.status?.toUpperCase() || 'UNKNOWN';

  // Extract necessary details from the complex JSON structure
  const vendorName = item.vendor?.name || 'Vendor N/A';
  const vehicleReg = item.vendor?.vehicle_registration_number || 'N/A';
  const vehicleType = item.vendor?.vehicle_type || item.vehicle?.model || 'N/A';
  const finalPrice =
    item.pricing?.display || item.final_price || item.estimated_price || 'N/A';
  const distanceDisplay = item.distance?.display || 'N/A';

  // Determine image source correctly: URI or local asset
  const imageSource = item.vehicle_image
    ? { uri: item.vehicle_image }
    : 'https://placehold.co/600x400'; // Use local import `placeholder`

  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>
          ID: {item.booking_id || `#${item.id}` || 'N/A'}
        </Text>
        <Text
          style={[
            styles.statusBadge,
            styles[`status_${item.status || 'unknown'}`],
          ]}
        >
          {statusText}
        </Text>
      </View>

      {/* Vehicle Image */}
      <Image source={imageSource} style={styles.vendorImage} />

      {/* Vendor and Vehicle */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Vendor:</Text>
        <Text style={styles.detailValue}>{vendorName}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Vehicle:</Text>
        <Text style={styles.detailValue}>
          {vehicleType} ({vehicleReg})
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Pickup/Drop Address */}
      <View style={styles.addressRow}>
        <Icon name="my-location" size={16} color="#4CAF50" />
        <Text style={styles.addressText} numberOfLines={1}>
          {item.pickup_location?.address || 'Pickup address not available'}
        </Text>
      </View>
      <View style={styles.addressRow}>
        <Icon name="location-on" size={16} color="#D32F2F" />
        <Text style={styles.addressText} numberOfLines={1}>
          {item.drop_location?.address || 'Drop address not available'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Other Details */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Scheduled Date:</Text>
        <Text style={styles.detailValue}>{getPickupDate(item)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Material (Weight):</Text>
        <Text style={styles.detailValue}>{formatMaterial(item)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Distance:</Text>
        <Text style={styles.detailValue}>{distanceDisplay}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Final Price:</Text>
        <Text
          style={[styles.detailValue, { fontWeight: 'bold', color: '#388E3C' }]}
        >
          {finalPrice}
        </Text>
      </View>

      {/* --- ADD REVIEW BUTTON CONDITIONALLY --- */}
      {item.status === 'completed' && (
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => {
            navigation.navigate('ReviewScreen', {
              bookingId: item.id,
              vendorId: item.vendor?.id, // Use nested vendor ID
            });
          }}
        >
          <Icon
            name="star-rate"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.reviewButtonText}>Add Review & Rating</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const BookingList = ({ status }) => {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
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

  const fetchBookingsForStatus = useCallback(async () => {
    setError('');
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Token not found.');

      // Note: The API endpoint for "active" in your response payload actually contains "pending" and "confirmed".
      // Assuming your backend handles the status mapping correctly based on the URL suffix.
      const endpoint = `${API_URL}/api/truck-booking/my-bookings/${status}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        // If the response structure has 'data.bookings', use that.
        setBookings(response.data.data.bookings || []);
      } else {
        throw new Error(
          response.data.message || `Failed to fetch ${status} bookings.`,
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        `Error fetching ${status} bookings.`;
      setError(msg);
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    setLoading(true);
    fetchBookingsForStatus();
  }, [fetchBookingsForStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookingsForStatus();
  }, [fetchBookingsForStatus]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6CFF" />
      </View>
    );
  }
  if (error && !refreshing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }
  if (bookings.length === 0 && !refreshing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyListText}>No {status} trips found.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={bookings}
        renderItem={({ item }) => (
          <BookingItem item={item} navigation={navigation} />
        )}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A6CFF']}
          />
        }
      />
      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
      />
    </>
  );
};

const TopTab = createMaterialTopTabNavigator();

const MyTripsScreen = ({ route }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>
      <TopTab.Navigator
        initialRouteName="PendingBookings"
        screenOptions={{
          tabBarLabelStyle: styles.tabLabel,
          tabBarIndicatorStyle: styles.tabIndicator,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#4A6CFF',
          tabBarInactiveTintColor: '#777E90',
          tabBarScrollEnabled: true,
          tabBarItemStyle: styles.tabStyle,
        }}
      >
        <TopTab.Screen name="PendingBookings">
          {() => <BookingList status="pending" />}
        </TopTab.Screen>
        <TopTab.Screen name="ActiveBookings">
          {() => <BookingList status="active" />}
        </TopTab.Screen>
        <TopTab.Screen name="CompletedBookings">
          {() => <BookingList status="completed" />}
        </TopTab.Screen>
        <TopTab.Screen name="CancelledBookings">
          {() => <BookingList status="cancelled" />}
        </TopTab.Screen>
      </TopTab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E2022' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  listContainer: { padding: 16, flexGrow: 1 },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: { fontSize: 16, color: '#777E90' },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 8,
  },
  bookingId: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 5,
    overflow: 'hidden',
  },
  status_pending: { backgroundColor: '#FFA000' },
  status_confirmed: { backgroundColor: '#1976D2' }, // Added confirmed status color
  status_active: { backgroundColor: '#1976D2' },
  status_ongoing: { backgroundColor: '#1976D2' },
  status_completed: { backgroundColor: '#388E3C' },
  status_cancelled: { backgroundColor: '#D32F2F' },
  status_unknown: { backgroundColor: '#777E90' },

  // --- DETAILS ---
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addressText: { marginLeft: 8, fontSize: 14, color: '#555', flex: 1 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  detailLabel: { fontSize: 13, color: '#777E90' },
  detailValue: {
    fontSize: 13,
    color: '#1E2022',
    fontWeight: '500',
    maxWidth: '60%',
  }, // Constrain value width

  // --- NEW STYLES ---
  vendorImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#EAEAEA',
    resizeMode: 'cover',
  },
  reviewButton: {
    marginTop: 15,
    backgroundColor: '#4A6CFF',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // --- TabView styles ---
  tabBar: { backgroundColor: '#FFFFFF', elevation: 1, shadowOpacity: 0 },
  tabIndicator: { backgroundColor: '#4A6CFF', height: 3 },
  tabLabel: {
    fontSize: 13,
    textTransform: 'capitalize',
    fontWeight: '600',
    margin: 0,
  },
  tabStyle: { width: 'auto', paddingHorizontal: 16 },
});

export default MyTripsScreen;