import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Assuming this is the correct import for AsyncStorage
import { API_URL } from '../../config/config'; // Import API_URL

// Helper function to format date
const formatDate = dateString => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper function to render an individual payment item
const PaymentItem = ({ payment }) => (
  <View style={styles.paymentCard}>
    <View style={styles.cardHeader}>
      <Text style={styles.planName}>{payment.plan_name}</Text>
      <View
        style={[
          styles.statusBadge,
          payment.payment_status === 'completed'
            ? styles.statusCompleted
            : styles.statusOther,
        ]}
      >
        <Text style={styles.statusText}>
          {payment.payment_status.toUpperCase()}
        </Text>
      </View>
    </View>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Invoice ID:</Text>
      <Text style={styles.detailValue}>{payment.invoice_id}</Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Amount Paid:</Text>
      <Text style={styles.detailValueBold}>
        {payment.currency} {payment.total_amount}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Subscription Period:</Text>
      <Text style={styles.detailValue}>
        {formatDate(payment.subscription_period.start)} -{' '}
        {formatDate(payment.subscription_period.end)}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Payment Date:</Text>
      <Text style={styles.detailValue}>{formatDate(payment.completed_at)}</Text>
    </View>
  </View>
);

const PaymentScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) {
        throw new Error('User token not found. Please log in.');
      }

      const response = await fetch(`${API_URL}/api/user/payments`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        // Use the error message from the API if available, otherwise a generic one
        const errorMessage = json.message || 'Failed to fetch payment history.';
        throw new Error(errorMessage);
      }

      setPayments(json.data.payments || []);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#4A6CFF" />
          <Text style={styles.loadingText}>Loading Payment History...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Icon name="error-outline" size={60} color="#FF6347" />
          <Text style={styles.errorText}>Could not load data.</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
        </View>
      );
    }

    if (payments.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <View style={styles.iconContainer}>
            <Icon name="receipt" size={80} color="#4A6CFF" />
          </View>
          <Text style={styles.title}>No Payments Found</Text>
          <Text style={styles.subtitle}>
            Your payment history appears to be empty.
          </Text>
        </View>
      );
    }

    // Display list of payments
    return (
      <FlatList
        data={payments}
        renderItem={({ item }) => <PaymentItem payment={item} />}
        keyExtractor={item => item.payment_id || item.invoice_id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment History</Text>
      </View>
      <View style={styles.container}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2022',
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E9EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#777E90',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A6CFF',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6347',
    marginTop: 10,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#777E90',
    textAlign: 'center',
    marginTop: 5,
  },
  listContent: {
    paddingVertical: 20,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2022',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusCompleted: {
    backgroundColor: '#D4EDDA', // Light green
  },
  statusOther: {
    backgroundColor: '#FFF3CD', // Light yellow for other statuses
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#155724', // Dark green
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777E90',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E2022',
    maxWidth: '60%', // Prevent text overflow
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A6CFF', // Primary color for amount
  },
});

export default PaymentScreen;
