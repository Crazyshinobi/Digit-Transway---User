// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   StatusBar,
//   ScrollView,
//   ActivityIndicator,
//   TouchableOpacity,
//   Linking,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useNavigation } from '@react-navigation/native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { WebView } from 'react-native-webview';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Snackbar from '../../components/Snackbar'; // Adjust path if needed
// import { API_URL } from '../../config/config'; // Adjust path if needed

// const SubscriptionScreen = () => {
//   const navigation = useNavigation();

//   // --- States ---
//   const [plans, setPlans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [subscribingPlanId, setSubscribingPlanId] = useState(null);
//   const [error, setError] = useState('');
//   const [snackbar, setSnackbar] = useState({
//     visible: false,
//     message: '',
//     type: '',
//   });
//   const [paymentWebViewUrl, setPaymentWebViewUrl] = useState(null);

//   // --- Snackbar helper ---
//   const showSnackbar = (message, type) => {
//     setSnackbar({ visible: true, message, type });
//     setTimeout(
//       () => setSnackbar({ visible: false, message: '', type: '' }),
//       3000,
//     );
//   };

//   // --- Fetch Subscription Plans ---
//   useEffect(() => {
//     const fetchPlans = async () => {
//       try {
//         setLoading(true);
//         const token = await AsyncStorage.getItem('@user_token');
//         if (!token) throw new Error('Authentication token not found.');

//         const response = await axios.get(`${API_URL}/api/plans/`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (response.data.success) {
//           const sortedPlans = response.data.data.plans.sort(
//             (a, b) => a.sort_order - b.sort_order,
//           );
//           setPlans(sortedPlans);
//         } else {
//           throw new Error(response.data.message || 'Failed to fetch plans.');
//         }
//       } catch (err) {
//         console.error('[Fetch Plans Error]', err);
//         const msg =
//           err.response?.data?.message || err.message || 'Error fetching plans.';
//         setError(msg);
//         showSnackbar(msg, 'error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPlans();
//   }, []);

//   // --- Handle Subscribe Plan ---
//   const handleChoosePlan = async planId => {
//     setSubscribingPlanId(planId);
//     try {
//       const token = await AsyncStorage.getItem('@user_token');
//       if (!token) throw new Error('Authentication token not found.');

//       const response = await axios.post(
//         `${API_URL}/api/plans/subscribe`,
//         { plan_id: planId },
//         { headers: { Authorization: `Bearer ${token}` } },
//       );

//       if (response.data.success) {
//         const paymentUrl = response.data.data?.payment_url;

//         if (paymentUrl) {
//           showSnackbar('Loading payment gateway...', 'success');
//           setPaymentWebViewUrl(paymentUrl);
//         } else {
//           showSnackbar('Subscription successful!', 'success');
//           setTimeout(() => navigation.replace('Dashboard'), 1500);
//         }
//       } else {
//         throw new Error(response.data.message || 'Subscription failed.');
//       }
//     } catch (err) {
//       console.error('[Subscription Error]', err);
//       const msg =
//         err.response?.data?.message || err.message || 'Subscription failed.';
//       showSnackbar(msg, 'error');
//     } finally {
//       setSubscribingPlanId(null);
//     }
//   };

//   // --- Handle Razorpay WebView ---
//   const handleWebViewNavigation = navState => {
//     const { url } = navState;
//     console.log('WebView URL Changed:', url);

//     if (url.includes('/payment-success')) {
//       setPaymentWebViewUrl(null);
//       showSnackbar('Payment successful! Redirecting...', 'success');
//       navigation.replace('Dashboard');
//     } else if (url.includes('/payment-failed')) {
//       setPaymentWebViewUrl(null);
//       showSnackbar('Payment failed. Please try again.', 'error');
//     }
//   };

//   // --- UI Rendering ---
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />

//       {paymentWebViewUrl ? (
//         // --- Payment WebView ---
//         <>
//           <View style={styles.webviewHeader}>
//             <TouchableOpacity
//               onPress={() => setPaymentWebViewUrl(null)}
//               style={styles.closeButton}
//             >
//               <Text style={styles.closeButtonText}>Close</Text>
//             </TouchableOpacity>
//             <Text style={styles.webviewHeaderText}>Complete Payment</Text>
//             <View style={{ width: 60 }} />
//           </View>

//           <WebView
//             source={{ uri: paymentWebViewUrl }}
//             onNavigationStateChange={handleWebViewNavigation}
//             startInLoadingState={true}
//             renderLoading={() => (
//               <View style={styles.loaderContainer}>
//                 <ActivityIndicator size="large" color="#4A6CFF" />
//               </View>
//             )}
//             javaScriptEnabled
//             domStorageEnabled
//             originWhitelist={['*']}
//           />
//         </>
//       ) : (
//         // --- Subscription Plan List ---
//         <>
//           <View style={styles.header}>
//             <Text style={styles.headerTitle}>Choose Your Plan</Text>
//           </View>

//           {loading && (
//             <View style={styles.centered}>
//               <ActivityIndicator size="large" color="#4A6CFF" />
//               <Text style={styles.loadingText}>Loading plans...</Text>
//             </View>
//           )}

//           {error && !loading && (
//             <View style={styles.centered}>
//               <Text style={styles.errorText}>Error: {error}</Text>
//             </View>
//           )}

//           {!loading && !error && plans.length > 0 && (
//             <ScrollView contentContainerStyle={styles.scrollContainer}>
//               {plans.map(plan => (
//                 <View
//                   key={plan.id}
//                   style={[
//                     styles.planCard,
//                     plan.is_popular && styles.popularCard,
//                   ]}
//                 >
//                   {plan.is_popular && (
//                     <Text style={styles.popularBadge}>POPULAR</Text>
//                   )}

//                   <Text style={styles.planName}>{plan.name}</Text>
//                   <Text style={styles.planDescription}>{plan.description}</Text>

//                   <View style={styles.priceContainer}>
//                     <Text style={styles.planPrice}>₹{plan.price}</Text>
//                     <Text style={styles.planDuration}>
//                       {' '}
//                       / {plan.duration_text}
//                     </Text>
//                   </View>

//                   <View style={styles.featuresList}>
//                     {plan.features.map((feature, index) => (
//                       <View key={index} style={styles.featureItem}>
//                         <Icon
//                           name="check-circle"
//                           size={18}
//                           color="#4CAF50"
//                           style={styles.featureIcon}
//                         />
//                         <Text style={styles.featureText}>{feature}</Text>
//                       </View>
//                     ))}
//                   </View>

//                   <TouchableOpacity
//                     style={[
//                       styles.chooseButton,
//                       { backgroundColor: plan.button_color || '#4A6CFF' },
//                       subscribingPlanId === plan.id && styles.disabledButton,
//                     ]}
//                     onPress={() => handleChoosePlan(plan.id)}
//                     disabled={subscribingPlanId !== null}
//                   >
//                     {subscribingPlanId === plan.id ? (
//                       <ActivityIndicator color="#FFFFFF" />
//                     ) : (
//                       <Text style={styles.chooseButtonText}>
//                         {plan.button_text}
//                       </Text>
//                     )}
//                   </TouchableOpacity>
//                 </View>
//               ))}
//             </ScrollView>
//           )}
//         </>
//       )}

//       <Snackbar
//         message={snackbar.message}
//         visible={snackbar.visible}
//         type={snackbar.type}
//       />
//     </SafeAreaView>
//   );
// };

// export default SubscriptionScreen;

// // --- Styles ---
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F7F8FA' },
//   header: {
//     paddingVertical: 15,
//     paddingHorizontal: 16,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//     alignItems: 'center',
//   },
//   headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E2022' },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: { marginTop: 10, fontSize: 16, color: '#777E90' },
//   errorText: { fontSize: 16, color: '#D92D20', textAlign: 'center' },
//   scrollContainer: { padding: 16 },
//   planCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     position: 'relative',
//   },
//   popularCard: { borderColor: '#4A6CFF', borderWidth: 2 },
//   popularBadge: {
//     position: 'absolute',
//     top: -10,
//     right: 15,
//     backgroundColor: '#FFC107',
//     color: '#1E2022',
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     borderRadius: 6,
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   planName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#1E2022',
//     marginBottom: 8,
//   },
//   planDescription: { fontSize: 14, color: '#777E90', marginBottom: 16 },
//   priceContainer: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//     marginBottom: 20,
//   },
//   planPrice: { fontSize: 28, fontWeight: 'bold', color: '#1E2022' },
//   planDuration: { fontSize: 14, color: '#777E90', marginLeft: 4 },
//   featuresList: { marginBottom: 24 },
//   featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
//   featureIcon: { marginRight: 8 },
//   featureText: { fontSize: 14, color: '#333', flex: 1 },
//   chooseButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
//   chooseButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
//   disabledButton: { backgroundColor: '#A0B2FF' },
//   webviewHeader: {
//     height: 60,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   webviewHeaderText: { fontSize: 18, fontWeight: '600', color: '#1E2022' },
//   closeButton: { padding: 8, minWidth: 60, alignItems: 'flex-start' },
//   closeButtonText: { fontSize: 16, color: '#4A6CFF', fontWeight: '500' },
//   loaderContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,255,255,0.8)',
//   },
// });

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
import RazorpayCheckout from 'react-native-razorpay';
import { API_URL } from '../../config/config';
import { PAYMENT_TEST_URL } from '../../config/config';

import Snackbar from '../../components/Snackbar';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
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

  // --- Fetch Plans on Load (Unchanged) ---
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await AsyncStorage.getItem('@user_token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${PAYMENT_TEST_URL}/api/plans/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const sortedPlans = response.data.data.plans.sort(
            (a, b) => a.sort_order - b.sort_order,
          );
          setPlans(sortedPlans);
        } else {
          throw new Error(response.data.message || 'Failed to fetch plans.');
        }
      } catch (err) {
        console.error(
          '[Fetch Plans Error]',
          err.response?.data || err.message || err,
        );
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'An error occurred while fetching plans.';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // --- REMOVED: Deep Link Listener useEffect ---

  // --- NEW: Verify Payment with Server (Step 7) ---
  const verifyPaymentOnServer = async (paymentData, localSubscriptionId) => {
    showSnackbar('Verifying payment...', 'info');
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) {
        throw new Error('Authentication token lost. Please log in again.');
      }

      // Step 7: Call POST /api/subscriptions/verify-payment
      const response = await axios.post(
        `${PAYMENT_TEST_URL}/api/plans/subscriptions/verify-payment`,
        {
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_subscription_id: paymentData.razorpay_subscription_id,
          razorpay_signature: paymentData.razorpay_signature,
          subscription_id: localSubscriptionId, // Add this - your DB subscription ID
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log('Verify Payment Response:', response.data);

      if (response.data.success) {
        showSnackbar('Payment verified! Subscription active.', 'success');
        setTimeout(() => navigation.replace('Dashboard'), 1500);
      } else {
        throw new Error(
          response.data.message || 'Payment verification failed.',
        );
      }
    } catch (err) {
      console.error(
        '[Verify Payment Error]',
        err.response?.data || err.message || err,
      );
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Payment verification failed. Please try again.';
      showSnackbar(errorMessage, 'error');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  // --- UPDATED: Handle Payment with Razorpay SDK (Steps 2-6) ---
  const handleChoosePlan = async planId => {
    setSubscribingPlanId(planId);
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log(`Subscribing to plan ${planId}`);
      console.log(`${PAYMENT_TEST_URL}/api/plans/subscribe`);

      const response = await axios.post(
        `${PAYMENT_TEST_URL}/api/plans/subscribe`,
        { plan_id: planId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log('Subscribe API Response:', response.data);

      if (response.data.success) {
        const {
          razorpay_key,
          razorpay_subscription_id,
          customer,
          amount_in_paise,
          plan_name,
          subscription_id, // <-- CAPTURE THIS from your backend
        } = response.data.data;

        if (!razorpay_key || !razorpay_subscription_id) {
          console.log('Free plan or non-payment plan detected.');
          showSnackbar('Subscription successful!', 'success');
          setTimeout(() => navigation.replace('Dashboard'), 1500);
          setSubscribingPlanId(null);
          return;
        }

        const options = {
          description: plan_name || 'Subscription',
          currency: 'INR',
          key: razorpay_key,
          subscription_id: razorpay_subscription_id,
          amount: amount_in_paise,
          name: 'Your App Name',
          prefill: {
            email: customer.email,
            contact: customer.contact,
            name: customer.name,
          },
          theme: { color: '#4A6CFF' },
        };

        RazorpayCheckout.open(options)
          .then(async data => {
            console.log('Razorpay Success:', data);
            // Pass the subscription_id to verification
            await verifyPaymentOnServer(data, subscription_id);
          })
          .catch(error => {
            console.error('Razorpay Error:', error);
            if (error.code === 0) {
              showSnackbar('Payment cancelled.', 'warning');
            } else {
              showSnackbar(
                `Payment failed: ${error.description || 'Please try again'}`,
                'error',
              );
            }
            setSubscribingPlanId(null);
          });
      } else {
        throw new Error(
          response.data.message || 'Subscription failed. Please try again.',
        );
      }
    } catch (err) {
      console.error(
        '[Subscription Error]',
        err.response?.data || err.message || err,
      );
      const errorMessage =
        err.response?.data?.message || err.message || 'Subscription failed.';
      showSnackbar(errorMessage, 'error');
      setSubscribingPlanId(null);
    }
  };

  // --- REMOVED: handleWebViewNavigation ---
  // --- REMOVED: parseUrlParams ---

  // --- Render methods ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
      {/* --- REMOVED: Conditional WebView Rendering --- */}
      {/* --- Original Subscription Plan UI (now permanent) --- */}
      <>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
        </View>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#4A6CFF" />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        )}
        {error && !loading && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}
        {!loading && !error && plans.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>
              No subscription plans available.
            </Text>
          </View>
        )}
        {!loading && !error && plans.length > 0 && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {plans.map(plan => (
              <View
                key={plan.id}
                style={[styles.planCard, plan.is_popular && styles.popularCard]}
              >
                {plan.is_popular && (
                  <Text style={styles.popularBadge}>POPULAR</Text>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.planPrice}>₹{plan.price}</Text>
                  <Text style={styles.planDuration}>
                    {' '}
                    / {plan.duration_text}
                  </Text>
                </View>
                <View style={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Icon
                        name="check-circle"
                        size={18}
                        color="#4CAF50"
                        style={styles.featureIcon}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.chooseButton,
                    { backgroundColor: plan.button_color || '#4A6CFF' },
                    subscribingPlanId === plan.id && styles.disabledButton,
                  ]}
                  onPress={() => handleChoosePlan(plan.id)}
                  disabled={subscribingPlanId !== null} // Disable all buttons while one is processing
                >
                  {subscribingPlanId === plan.id ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.chooseButtonText}>
                      {plan.button_text}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </>
      {/* --- End of Original UI --- */}
      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
      />
    </SafeAreaView>
  );
};

// --- Styles ---
// (Most styles are the same, removed WebView-specific styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 16,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  scrollContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  popularCard: {
    borderColor: '#4A6CFF',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 15,
    backgroundColor: '#FFC107',
    color: '#1E2022',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#777E90',
    marginBottom: 16,
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
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  chooseButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  chooseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A0B2FF', // Lighter color when loading
  },
});

export default SubscriptionScreen;
