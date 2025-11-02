import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Snackbar from '../../components/Snackbar';

const BookingItem = ({ item }) => (
  <View style={styles.bookingCard}>
    <View style={styles.cardHeader}>
      <Text style={styles.bookingId}>ID: #{item.id || 'N/A'}</Text>
      <Text
        style={[
          styles.statusBadge,
          styles[`status_${item.status || 'unknown'}`],
        ]}
      >
        {item.status?.toUpperCase() || 'UNKNOWN'}
      </Text>
    </View>
    <View style={styles.addressRow}>
      <Icon name="my-location" size={16} color="#4CAF50" />
      <Text style={styles.addressText} numberOfLines={1}>
        {item.pickup_address || 'Pickup address not available'}
      </Text>
    </View>
    <View style={styles.addressRow}>
      <Icon name="location-on" size={16} color="#D32F2F" />
      <Text style={styles.addressText} numberOfLines={1}>
        {item.drop_address || 'Drop address not available'}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Date:</Text>
      <Text style={styles.detailValue}>
        {item.pickup_datetime
          ? new Date(item.pickup_datetime).toLocaleDateString()
          : 'N/A'}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Truck:</Text>
      <Text style={styles.detailValue}>
        {item.truck_specification?.model_name || 'N/A'}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Price:</Text>
      <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>
        ₹{item.final_price || item.estimated_price || 'N/A'}
      </Text>
    </View>
  </View>
);

const BookingList = ({ status }) => {
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
    // ... (fetch logic remains exactly the same)
    setError('');
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Token not found.');
      const endpoint = `${API_URL}/api/truck-booking/my-bookings/${status}`;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
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
    /* ... (Empty list JSX) ... */
  }

  return (
    <>
      <FlatList
        data={bookings}
        renderItem={({ item }) => <BookingItem item={item} />}
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

const MyTripsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>
      <TopTab.Navigator
        screenOptions={{
          tabBarLabelStyle: styles.tabLabel,
          tabBarIndicatorStyle: styles.tabIndicator,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#4A6CFF',
          tabBarInactiveTintColor: '#777E90',
          tabBarScrollEnabled: true, // Allows scrolling if needed
          tabBarItemStyle: styles.tabStyle, // Control individual tab width/padding
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
  status_active: { backgroundColor: '#1976D2' },
  status_ongoing: { backgroundColor: '#1976D2' },
  status_completed: { backgroundColor: '#388E3C' },
  status_cancelled: { backgroundColor: '#D32F2F' },
  status_unknown: { backgroundColor: '#777E90' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addressText: { marginLeft: 8, fontSize: 14, color: '#555', flex: 1 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  detailLabel: { fontSize: 13, color: '#777E90' },
  detailValue: { fontSize: 13, color: '#1E2022', fontWeight: '500' },
  // --- TabView styles (Adjusted for Material Top Tabs) ---
  tabBar: { backgroundColor: '#FFFFFF', elevation: 1, shadowOpacity: 0 },
  tabIndicator: { backgroundColor: '#4A6CFF', height: 3 },
  tabLabel: {
    fontSize: 13,
    textTransform: 'capitalize',
    fontWeight: '600',
    margin: 0,
  },
  tabStyle: { width: 'auto', paddingHorizontal: 16 }, // Tabs take width based on label
});

export default MyTripsScreen;
