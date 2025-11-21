import React, { useState, useEffect, useCallback } from 'react';
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
  PermissionsAndroid,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
// --- NEW --- Import useRoute
import {
  useNavigation,
  useIsFocused,
  useRoute,
} from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePicker from 'react-native-date-picker';
import Geolocation from 'react-native-geolocation-service';
import { API_URL } from '../../config/config';
import Snackbar from '../../components/Snackbar';
import Icon from 'react-native-vector-icons/MaterialIcons';

// --- (Reusable Components) ---

// --- NEW --- Modified CustomTextInput to accept and style 'editable' prop
const CustomTextInput = ({
  label,
  value,
  onChangeText,
  containerStyle,
  editable = true, // Default to true
  ...props
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
      <Text style={styles.label}>{label}</Text> 
    <View
      style={[
        styles.inputWrapper,
        !editable && styles.disabledInputWrapper, // Style for read-only
      ]}
    >
        
      <TextInput
        style={styles.input}
        placeholderTextColor="#C7C7CD"
        value={value}
        onChangeText={onChangeText}
        editable={editable} // Pass editable to TextInput
        {...props}
      />
       
    </View>
    
  </View>
);

const CustomDropdown = ({
  label,
  data,
  value,
  onChange,
  placeholder,
  containerStyle,
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
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
      search
      searchPlaceholder="Search..."
    />
    
  </View>
);

const NewBookingScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const route = useRoute(); // --- NEW --- Get route object
  const { bookingId } = route.params || {}; // --- NEW --- Get bookingId if passed

  const DEFAULT_LAT = 28.6139;
  const DEFAULT_LNG = 77.209;

  const [bookingData, setBookingData] = useState({
    pickup_address: '',
    drop_address: '',
    material_id: null,
    vehicle_model_id: null,
    material_weight: '',
    pickup_datetime: new Date(),
    special_instructions: '',
    pickup_latitude: DEFAULT_LAT,
    pickup_longitude: DEFAULT_LNG,
    drop_latitude: 19.076,
    drop_longitude: 72.8777,
    distance_km: 0,
    payment_method: null,
    vendor_id: null,
    estimated_price: 0,
    adjusted_price: null,
  });

  const [materials, setMaterials] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]); // --- Pincode States ---

  const [pickupPincode, setPickupPincode] = useState('');
  const [dropPincode, setDropPincode] = useState('');
  const [pickupLocations, setPickupLocations] = useState([]);
  const [dropLocations, setDropLocations] = useState([]);
  const [isPickupLoading, setIsPickupLoading] = useState(false);
  const [isDropLoading, setIsDropLoading] = useState(false); // --- NEW --- State for pre-filling locations

  const [isPrefillingLocation, setIsPrefillingLocation] = useState(false);
  const [prefilledLocations, setPrefilledLocations] = useState(null); // { pickup: data, drop: data } // -------------------------
  const [availableVendors, setAvailableVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [calculatedData, setCalculatedData] = useState(null);
  const [priceCalculated, setPriceCalculated] = useState(false);

  const [loadingFormData, setLoadingFormData] = useState(true);
  const [findingVendors, setFindingVendors] = useState(false);
  const [calculatingPriceForVendor, setCalculatingPriceForVendor] =
    useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: '',
  });

  const handleInputChange = (field, value) => {
    // Reset flow if primary details change
    if (
      [
        'pickup_latitude',
        'pickup_longitude',
        'vehicle_model_id',
        'material_weight',
      ].includes(field)
    ) {
      setAvailableVendors([]);
      setSelectedVendor(null);
      setPriceCalculated(false);
      setCalculatedData(null);
      setBookingData(prev => ({
        ...prev,
        vendor_id: null,
        adjusted_price: null,
      }));
    }
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const showSnackbar = (message, type) => {
    setSnackbar({ visible: true, message, type });
    setTimeout(
      () => setSnackbar({ visible: false, message: '', type: '' }),
      3000,
    );
  }; // --- Location & Initial Data Fetching ---

  useEffect(() => {
    if (isFocused) {
      setLoadingFormData(true); // --- NEW --- Only get current location if NOT pre-filling
      if (!bookingId) {
        requestLocationPermission();
      }
      fetchFormData();
    }
  }, [isFocused, bookingId]); // --- NEW --- Add bookingId dependency

  const requestLocationPermission = async () => {
    // ... (This function remains unchanged)
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Digit Transway Location Permission',
            message: 'We need your location to find nearby vendors.',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          showSnackbar('Location permission denied. Using default.', 'error');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      Geolocation.requestAuthorization('whenInUse').then(status => {
        if (status === 'granted') {
          getCurrentLocation();
        } else {
          showSnackbar('Location permission denied. Using default.', 'error');
        }
      });
    }
  };

  const getCurrentLocation = () => {
    // ... (This function remains unchanged)
    Geolocation.getCurrentPosition(
      position => {
        console.log('Real location obtained:', position.coords);
        setBookingData(prev => ({
          ...prev,
          pickup_latitude: position.coords.latitude,
          pickup_longitude: position.coords.longitude,
        }));
      },
      error => {
        console.warn(
          'Could not get GPS location, using default.',
          error.message,
        );
        showSnackbar('Could not get GPS location, using default.', 'error');
        setBookingData(prev => ({
          ...prev,
          pickup_latitude: DEFAULT_LAT,
          pickup_longitude: DEFAULT_LNG,
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const fetchFormData = async () => {
    // ... (This function remains unchanged)
    setLoadingFormData(true);
    try {
      const token = await AsyncStorage.getItem('@user_token');
      console.log(token);
      if (!token) throw new Error('Token not found');
      const response = await axios.get(
        `${API_URL}/api/truck-booking/form-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        setMaterials(
          response.data.data.materials.map(m => ({
            label: m.name,
            value: m.id,
          })),
        );
        setVehicleModels(
          response.data.data.vehicle_models.map(v => ({
            label: `${v.model_name} (${v.capacity})`,
            value: v.id,
          })),
        );
        setPaymentMethods(
          response.data.data.payment_methods.map(p => ({
            label: p.label,
            value: p.value,
          })),
        );
      } else {
        throw new Error(response.data.message || 'Failed to load form data');
      }
    } catch (err) {
      showSnackbar(err.message || 'Error loading data.', 'error');
    } finally {
      setLoadingFormData(false);
    }
  }; // --- NEW --- Effect: Fetch locations if bookingId is provided

  useEffect(() => {
    if (isFocused && bookingId) {
      console.log(`Pre-filling locations for booking ID: ${bookingId}`);
      fetchBookingLocations(bookingId);
    } else {
      // Ensure we reset if the user navigates back to this screen without a bookingId
      setPrefilledLocations(null);
    }
  }, [isFocused, bookingId]); // --- NEW --- Function to fetch locations from existing booking

  const fetchBookingLocations = async id => {
    setIsPrefillingLocation(true);
    setPrefilledLocations(null); // Clear previous
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Token not found');
      const headers = { Authorization: `Bearer ${token}` }; // Use Promise.all to fetch both concurrently

      const [pickupRes, dropRes] = await Promise.all([
        axios.get(`${API_URL}/api/booking-location/${id}/pickup`, { headers }),
        axios.get(`${API_URL}/api/booking-location/${id}/drop`, { headers }),
      ]);

      if (!pickupRes.data.success || !dropRes.data.success) {
        throw new Error('Failed to retrieve one or both locations.');
      }

      const pickupData = pickupRes.data.data;
      const dropData = dropRes.data.data;

      console.log('Prefill Pickup:', pickupData);
      console.log('Prefill Drop:', dropData); // Set the prefilled data to control the UI

      setPrefilledLocations({ pickup: pickupData, drop: dropData }); // Update the main bookingData state with this information

      setBookingData(prev => ({
        ...prev,
        pickup_address: pickupData.address,
        pickup_latitude: pickupData.latitude,
        pickup_longitude: pickupData.longitude,
        drop_address: dropData.address,
        drop_latitude: dropData.latitude,
        drop_longitude: dropData.longitude,
      }));

      showSnackbar('Locations pre-filled from previous booking.', 'success');
    } catch (err) {
      showSnackbar(
        err.response?.data?.message ||
          err.message ||
          'Error pre-filling locations.',
        'error',
      );
      console.error('Failed to fetch booking locations:', err);
    } finally {
      setIsPrefillingLocation(false);
    }
  }; // --- Pincode Logic ---

  const fetchLocationsByPincode = async (pincode, type) => {
    // ... (This function remains unchanged)
    if (pincode.length !== 6) {
      showSnackbar('Please enter a valid 6-digit pincode.', 'error');
      return;
    }

    if (type === 'pickup') {
      setIsPickupLoading(true);
      setPickupLocations([]);
      handleInputChange('pickup_address', ''); // Reset selection
    } else {
      setIsDropLoading(true);
      setDropLocations([]);
      handleInputChange('drop_address', ''); // Reset selection
    }

    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Token not found.');

      const response = await axios.get(
        `${API_URL}/api/pincode/location?pincode=${pincode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        const { all_post_offices, district, state } = response.data.data;
        const formattedLocations = all_post_offices.map(po => {
          const label = `${po.name}, ${district}, ${state}`;
          return { label: label, value: label };
        });

        if (type === 'pickup') {
          setPickupLocations(formattedLocations);
        } else {
          setDropLocations(formattedLocations);
        }
      } else {
        throw new Error(response.data.message || 'No locations found.');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    } finally {
      if (type === 'pickup') {
        setIsPickupLoading(false);
      } else {
        setIsDropLoading(false);
      }
    }
  };

  const handlePincodeChange = (text, type) => {
    // ... (This function remains unchanged)
    const numericText = text.replace(/[^0-9]/g, '');
    if (type === 'pickup') {
      setPickupPincode(numericText);
      if (numericText.length === 6) {
        fetchLocationsByPincode(numericText, 'pickup');
      } else {
        setPickupLocations([]); // Clear results if not 6 digits
        handleInputChange('pickup_address', ''); // Clear selection
      }
    } else {
      setDropPincode(numericText);
      if (numericText.length === 6) {
        fetchLocationsByPincode(numericText, 'drop');
      } else {
        setDropLocations([]);
        handleInputChange('drop_address', '');
      }
    }
  }; // ------------------------- // --- Step 1: Find Available Vendors ---
  const handleFindVendors = async () => {
    // ... (This function remains unchanged)
    const requiredFields = ['vehicle_model_id', 'material_weight'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        showSnackbar(
          `Please fill out ${field.replace('_', ' ')} first.`,
          'error',
        );
        return;
      }
    }

    setFindingVendors(true);
    setAvailableVendors([]);
    setSelectedVendor(null);
    setPriceCalculated(false);
    setCalculatedData(null);

    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Token not found.');

      const payload = {
        pickup_latitude: bookingData.pickup_latitude,
        pickup_longitude: bookingData.pickup_longitude,
        vehicle_model_id: bookingData.vehicle_model_id,
        material_weight: parseFloat(bookingData.material_weight) || 0,
      };

      console.log('[Find Vendors] Sending payload:', payload);
      const response = await axios.post(
        `${API_URL}/api/truck-booking/available-vendors`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setAvailableVendors(response.data.data.vehicles || []);
        showSnackbar(response.data.message || 'Vendors found!', 'success');
      } else {
        throw new Error(response.data.message || 'No vendors found.');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    } finally {
      setFindingVendors(false);
    }
  }; // --- Step 2: Calculate Price for Selected Vendor ---

  const handleSelectAndCalculatePrice = async vendor => {
    // ... (This function remains unchanged, including enhanced logging)
    setSelectedVendor(vendor);
    setCalculatingPriceForVendor(vendor.vendor_id);
    setPriceCalculated(false);
    setCalculatedData(null);

    const payload = {
      vendor_id: vendor.vendor_id,
      pickup_latitude: bookingData.pickup_latitude,
      pickup_longitude: bookingData.pickup_longitude,
      drop_latitude: bookingData.drop_latitude,
      drop_longitude: bookingData.drop_longitude,
      material_id: bookingData.material_id,
      material_weight: parseFloat(bookingData.material_weight) || 0,
    };

    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Token not found.');

      console.log('[Calculate Price] Sending payload:', payload);

      const response = await axios.post(
        `${API_URL}/api/truck-booking/calculate-vendor-price`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setCalculatedData(response.data.data);
        setBookingData(prev => ({
          ...prev,
          vendor_id: response.data.data.vendor.id,
          distance_km:
            response.data.data.trip_details.distance_km || prev.distance_km,
          estimated_price: response.data.data.pricing.total_price || 0,
          adjusted_price: response.data.data.pricing.total_price || 0,
        }));
        setPriceCalculated(true);
        showSnackbar('Price calculated successfully!', 'success');
      } else {
        console.error(
          '[Calculate Price] API Error (Success: false):',
          response.data.message,
        );
        throw new Error(response.data.message || 'Failed to calculate price.');
      }
    } catch (err) {
      console.error('--- [Error] Price Calculation Failed ---');
      console.error('Timestamp:', new Date().toISOString());
      console.error(
        'Failed Vendor:',
        vendor.vendor_name,
        `(ID: ${vendor.vendor_id})`,
      );
      console.error('Request Payload:', JSON.stringify(payload, null, 2));

      if (axios.isAxiosError(err)) {
        console.error('Error Type: Axios Error');
        if (err.response) {
          console.error('Status Code:', err.response.status);
          console.error(
            'Response Data:',
            JSON.stringify(err.response.data, null, 2),
          );
        } else if (err.request) {
          console.error(
            'Error: No response received. Check network, API_URL, or CORS.',
          );
        } else {
          console.error('Axios Setup Error Message:', err.message);
        }
      } else {
        console.error('Error Type: JavaScript Error');
        console.error('Error Message:', err.message);
      }
      console.error('Stack Trace:', err.stack);
      console.error('--- End of Error Report ---');

      const userMessage =
        err.response?.data?.message ||
        err.message ||
        'Price calculation failed.';
      showSnackbar(userMessage, 'error');
      setSelectedVendor(null);
    } finally {
      setCalculatingPriceForVendor(null);
    }
  }; // --- Step 3: Create Final Booking ---

  const handleCreateBooking = async () => {
    // ... (This function remains unchanged)
    if (!priceCalculated || !bookingData.vendor_id) {
      showSnackbar('Please select a vendor and calculate the price.', 'error');
      return;
    }
    if (!bookingData.payment_method) {
      showSnackbar('Please select a payment method.', 'error');
      return;
    }
    if (!bookingData.pickup_address) {
      showSnackbar('Please select a pickup location.', 'error');
      return;
    }
    if (!bookingData.drop_address) {
      showSnackbar('Please select a drop location.', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) throw new Error('Session expired.');

      const formattedDate = bookingData.pickup_datetime
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      const payload = {
        vendor_id: bookingData.vendor_id,
        vehicle_model_id: bookingData.vehicle_model_id,
        pickup_address: bookingData.pickup_address,
        pickup_latitude: bookingData.pickup_latitude,
        pickup_longitude: bookingData.pickup_longitude,
        drop_address: bookingData.drop_address,
        drop_latitude: bookingData.drop_latitude,
        drop_longitude: bookingData.drop_longitude,
        material_id: bookingData.material_id,
        material_weight: parseFloat(bookingData.material_weight) || 0,
        distance_km: bookingData.distance_km,
        estimated_price: bookingData.estimated_price,
        adjusted_price:
          bookingData.adjusted_price || bookingData.estimated_price,
        payment_method: bookingData.payment_method,
        pickup_datetime: formattedDate,
        special_instructions: bookingData.special_instructions,
      };

      const response = await axios.post(
        `${API_URL}/api/truck-booking/create-with-vendor`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        showSnackbar(
          response.data.message || 'Booking request sent!',
          'success',
        );
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        if (response.data.errors) {
          const errorMessages = Object.values(response.data.errors)
            .flat()
            .join('\n');
          throw new Error(errorMessages || 'Validation failed.');
        }
        throw new Error(response.data.message || 'Failed to create booking.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || err.message || 'An error occurred.';
      showSnackbar(errorMessage, 'error');
    } finally {
      setBookingLoading(false);
    }
  }; // --- Render Vendor Card ---

  const renderVendorCard = ({ item }) => {
    // ... (This function remains unchanged)
    const isSelected = selectedVendor?.vendor_id === item.vendor_id;
    const isCalculating = calculatingPriceForVendor === item.vendor_id;
    return (
      <TouchableOpacity
        style={[styles.vendorCard, isSelected && styles.vendorCardSelected]}
        onPress={() => handleSelectAndCalculatePrice(item)}
        disabled={calculatingPriceForVendor !== null}
      >
           
        <Image
          source={{
            uri: item.vehicle_image || 'https://via.placeholder.com/100',
          }}
          style={styles.vendorImage}
        />
           
        <View style={styles.vendorInfo}>
               <Text style={styles.vendorName}>{item.vendor_name}</Text> 
            
          <Text style={styles.vendorVehicle}>{item.vehicle_brand_model}</Text>
             
          <Text style={styles.vendorDistance}>
                  {item.distance_km.toFixed(1)} km away •
            {item.estimated_arrival}    
          </Text>
              
          <View style={styles.vendorRating}>
                  <Icon name="star" size={16} color="#FFC107" />    
            
            <Text style={styles.vendorRatingText}>
                     {item.rating} ({item.trips_completed} trips)    
               
            </Text>
                
          </View>
             
        </View>
           
        <View style={styles.vendorPriceContainer}>
              
          {/* {isCalculating ? (
            <ActivityIndicator color="#4A6CFF" />
          ) : item.pricing?.total_price !== undefined ? (
            <Text style={styles.vendorPrice}>
                     ₹{item.pricing.total_price.toFixed(0)}     
            </Text>
          ) : (
            <Text style={styles.vendorPrice}>N/A</Text>
          )} */}
              
          {isSelected && !isCalculating && (
            <Icon name="check-circle" size={24} color="#4CAF50" />
          )}
             
        </View>
          
      </TouchableOpacity>
    );
  };

  if (loadingFormData) {
    return (
      <SafeAreaView style={styles.centered}>
            <ActivityIndicator size="large" color="#4A6CFF" />   
        <Text style={styles.loadingText}>Loading booking options...</Text>  
      </SafeAreaView>
    );
  }

  const canFindVendors =
    bookingData.vehicle_model_id && bookingData.material_weight;

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
            <Text style={styles.headerTitle}>Create New Booking</Text>
            <View style={{ width: 40 }} />  
      </View>
        
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
           
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
               <Text style={styles.sectionTitle}>Load Details</Text>
              
          <CustomDropdown
            label="Material Type*"
            data={materials}
            value={bookingData.material_id}
            onChange={item => handleInputChange('material_id', item.value)}
            placeholder="Select material"
          />
              
          <CustomTextInput
            label="Material Weight (tons)*"
            value={bookingData.material_weight}
            onChangeText={val => handleInputChange('material_weight', val)}
            placeholder="e.g., 5.5"
            keyboardType="numeric"
          />
              
          <CustomDropdown
            label="Truck Specification*"
            data={vehicleModels}
            value={bookingData.vehicle_model_id}
            onChange={item => handleInputChange('vehicle_model_id', item.value)}
            placeholder="Select truck type"
          />
               <Text style={styles.sectionTitle}>Route Details</Text>  
            {/* --- NEW: Conditional Location Logic --- */}    
          {isPrefillingLocation ? (
            <View style={styles.centeredSmall}>
                     <ActivityIndicator size="large" color="#4A6CFF" />
                   
              <Text style={styles.loadingText}>
                Loading previous locations...
              </Text>
                   
            </View>
          ) : prefilledLocations ? (
            <>
                     {/* --- Show Pre-filled Pickup Location --- */}
                    
              <CustomTextInput
                label="Pickup Location (Pre-filled)"
                value={prefilledLocations.pickup.address}
                editable={false}
              />
                     {/* --- Show Pre-filled Drop Location --- */}
                    
              <CustomTextInput
                label="Drop Location (Pre-filled)"
                value={prefilledLocations.drop.address}
                editable={false}
              />
                     {/* --- Add a button to clear this --- */}    
               
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setPrefilledLocations(null); // Also clear the data from bookingData
                  setBookingData(prev => ({
                    ...prev,
                    pickup_address: '',
                    pickup_latitude: DEFAULT_LAT,
                    pickup_longitude: DEFAULT_LNG,
                    drop_address: '',
                    drop_latitude: 19.076,
                    drop_longitude: 72.8777,
                  }));
                  setPickupPincode('');
                  setDropPincode('');
                  requestLocationPermission(); // Get current location
                }}
              >
                       
                <Text style={styles.clearButtonText}>
                  Enter locations manually
                </Text>
                      
              </TouchableOpacity>
                   
            </>
          ) : (
            <>
                     {/* --- Original Pickup Address Flow --- */}
                    
              <CustomTextInput
                label="Pickup Pincode*"
                value={pickupPincode}
                onChangeText={val => handlePincodeChange(val, 'pickup')}
                placeholder="Enter 6-digit pincode"
                keyboardType="number-pad"
                maxLength={6}
              />
                    
              {isPickupLoading && (
                <ActivityIndicator
                  style={{ marginVertical: 10 }}
                  color="#4A6CFF"
                />
              )}
                    
              {pickupLocations.length > 0 && !isPickupLoading && (
                <CustomDropdown
                  label="Select Pickup Location*"
                  data={pickupLocations}
                  value={bookingData.pickup_address}
                  onChange={item =>
                    handleInputChange('pickup_address', item.value)
                  }
                  placeholder="Select from list"
                />
              )}
                     {/* --- Original Drop Address Flow --- */}
               _      
              <CustomTextInput
                label="Drop Pincode*"
                value={dropPincode}
                onChangeText={val => handlePincodeChange(val, 'drop')}
                placeholder="Enter 6-digit pincode"
                keyboardType="number-pad"
                maxLength={6}
              />
                    
              {isDropLoading && (
                <ActivityIndicator
                  style={{ marginVertical: 10 }}
                  color="#4A6CFF"
                />
              )}
                    
              {dropLocations.length > 0 && !isDropLoading && (
                <CustomDropdown
                  label="Select Drop Location*"
                  data={dropLocations}
                  value={bookingData.drop_address}
                  onChange={item =>
                    handleInputChange('drop_address', item.value)
                  }
                  placeholder="Select from list"
                />
              )}
                   
            </>
          )}
               {/* ----------------------------- */}    
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (!canFindVendors || findingVendors) && styles.disabledButton,
            ]}
            onPress={handleFindVendors}
            disabled={!canFindVendors || findingVendors}
          >
                 
            {findingVendors ? (
              <ActivityIndicator color="#4A6CFF" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                        Find Available Vendors       
              </Text>
            )}
                
          </TouchableOpacity>
              
          {availableVendors.length > 0 && ( // ... (Vendor list rendering remains unchanged)
            <View>
                    
              <Text style={styles.sectionTitle}>Select a Vendor</Text>
                    
              <FlatList
                data={availableVendors}
                renderItem={renderVendorCard}
                keyExtractor={item => item.vendor_id.toString()}
              />
                   
            </View>
          )}
              
          {priceCalculated &&
            calculatedData && ( // ... (Price details rendering remains unchanged)
              <View style={styles.calculatedSection}>
                      
                <Text style={styles.sectionTitle}>Final Price Details</Text> 
                    
                <View style={styles.detailRow}>
                         
                  <Text style={styles.detailLabel}>Vendor:</Text>       
                  <Text style={styles.detailValue}>
                             {calculatedData.vendor?.name || 'N/A'} 
                         
                  </Text>
                        
                </View>
                      
                <View style={styles.detailRow}>
                         
                  <Text style={styles.detailLabel}>Vehicle:</Text>      
                  
                  <Text style={styles.detailValue}>
                            
                    {calculatedData.vendor?.vehicle_model || 'N/A'}      
                    
                  </Text>
                        
                </View>
                      
                <View style={styles.detailRow}>
                         
                  <Text style={styles.detailLabel}>Distance:</Text>      
                  
                  <Text style={styles.detailValue}>
                            
                    {calculatedData.trip_details?.distance_text || 'N/A'}   
                       
                  </Text>
                        
                </View>
                      
                {calculatedData.pricing?.is_editable && (
                  <CustomTextInput
                    label="Adjust Price (Optional)"
                    value={bookingData.adjusted_price?.toString() || ''}
                    onChangeText={val =>
                      handleInputChange('adjusted_price', val)
                    }
                    placeholder={`Current: ₹${calculatedData.pricing?.total_price?.toFixed(
                      2,
                    )}`}
                    keyboardType="numeric"
                    containerStyle={{ marginTop: 10 }}
                  />
                )}
                     
              </View>
            )}
              
          {priceCalculated && ( // ... (Schedule & Payment rendering remains unchanged)
            <>
                    
              <Text style={styles.sectionTitle}>Schedule & Payment</Text>   
                 <Text style={styles.label}>Pickup Date & Time*</Text>   
                
              <TouchableOpacity
                style={styles.dateInputWrapper}
                onPress={() => setDatePickerOpen(true)}
              >
                       
                <Text style={styles.dateText}>
                          
                  {bookingData.pickup_datetime.toLocaleString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                         
                </Text>
                       
                <Icon name="calendar-today" size={20} color="#8A8A8E" />   
                  
              </TouchableOpacity>
                    
              <DatePicker
                modal
                open={datePickerOpen}
                date={bookingData.pickup_datetime}
                onConfirm={date => {
                  setDatePickerOpen(false);
                  handleInputChange('pickup_datetime', date);
                }}
                onCancel={() => setDatePickerOpen(false)}
                minimumDate={new Date()}
              />
                    
              <CustomDropdown
                label="Payment Method*"
                data={paymentMethods}
                value={bookingData.payment_method}
                onChange={item =>
                  handleInputChange('payment_method', item.value)
                }
                placeholder="Select when to pay"
              />
                    
              <CustomTextInput
                label="Special Instructions (Optional)"
                value={bookingData.special_instructions}
                onChangeText={val =>
                  handleInputChange('special_instructions', val)
                }
                placeholder="e.g., Handle with care"
                multiline
              />
                    
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!priceCalculated || bookingLoading) && styles.disabledButton,
                ]}
                _
                onPress={handleCreateBooking}
                disabled={!priceCalculated || bookingLoading}
              >
                       
                {bookingLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Request Booking</Text>
                )}
                      
              </TouchableOpacity>
                   
            </>
          )}
             
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

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  keyboardAvoidingView: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  }, // --- NEW --- Small centered view for inline loading
  centeredSmall: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: '#777E90' },
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
  scrollContainer: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 15,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4A6CFF',
    paddingLeft: 8,
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, color: '#1E2022', fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 55,
  }, // --- NEW --- Style for disabled/read-only input
  disabledInputWrapper: {
    backgroundColor: '#F5F5F5',
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
  dropdown: {
    minHeight: 55,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  placeholderStyle: { fontSize: 16, color: '#C7C7CD' },
  selectedTextStyle: { fontSize: 16, color: '#1E2022' },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 55,
    paddingHorizontal: 16,
  },
  dateText: { fontSize: 16, color: '#1E2022' },
  primaryButton: {
    backgroundColor: '#4A6CFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4A6CFF',
  },
  secondaryButtonText: { color: '#4A6CFF', fontSize: 16, fontWeight: '600' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  calculatedSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: { fontSize: 14, color: '#777E90' },
  detailValue: { fontSize: 14, color: '#1E2022', fontWeight: '500' },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    flexDirection: 'row',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  vendorCardSelected: {
    borderColor: '#4A6CFF',
    borderWidth: 2,
    backgroundColor: '#E9EFFF',
  },
  vendorImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  vendorInfo: { flex: 1, justifyContent: 'center' },
  vendorName: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
  vendorVehicle: { fontSize: 14, color: '#777E90' },
  vendorDistance: { fontSize: 12, color: '#777E90', marginTop: 4 },
  vendorRating: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  vendorRatingText: { marginLeft: 4, fontSize: 12, color: '#1E2022' },
  vendorPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  vendorPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E2022',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
  }, // --- NEW --- Styles for the clear button
  clearButton: {
    backgroundColor: '#FFF1F0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF4D4F',
  },
  clearButtonText: {
    color: '#FF4D4F',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NewBookingScreen;
