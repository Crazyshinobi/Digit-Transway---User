import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import HomeScreen from '../tabs/HomeScreen';
import MyTripsScreen from '../tabs/MyTripsScreen';
import PaymentScreen from '../tabs/PaymentScreen';
import HelpScreen from '../tabs/HelpScreen';
import ProfileScreen from '../tabs/ProfileScreen';
const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.bottomNavContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName =
          label === 'Home'
            ? 'home'
            : label === 'My Trips'
            ? 'local-shipping'
            : label === 'Payment'
            ? 'payment'
            : label === 'Profile'
            ? 'person'
            : 'help';

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.navItem}
          >
            <Icon
              name={iconName}
              size={22}
              color={isFocused ? '#4A6CFF' : '#8A8A8E'}
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color: isFocused ? '#4A6CFF' : '#8A8A8E',
                  fontWeight: isFocused ? '600' : '400',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const DashboardScreen = () => {
  const navigation = useNavigation(); // Get navigation object

  // --- Back Press Handler Logic ---
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        const state = navigation.getState();
        const currentRoute = state.routes[state.index];

        // Check if we are on the first tab ('Home') of the Dashboard
        if (currentRoute.name === 'Home') {
          // If on the Home tab, show the exit confirmation dialog
          Alert.alert(
            'Exit Application',
            'Are you sure you want to exit the application?',
            [
              { text: 'Cancel', onPress: () => null, style: 'cancel' },
              { text: 'Exit', onPress: () => BackHandler.exitApp() }, // Exit the app
            ],
            { cancelable: false }, // Prevent dismissing dialog by tapping outside
          );
          return true; // Prevent default back button behavior (exiting app)
        } else {
          // If not on the Home tab, navigate back to the Home tab first
          navigation.navigate('Home');
          return true; // Prevent default back button behavior
        }
      };

      // Add the event listener for the hardware back press
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      // Remove the event listener when the screen loses focus or unmounts
      return () => subscription.remove();
    }, [navigation]), // Dependency array includes navigation
  );

  return (
    // Use SafeAreaView to avoid notches/status bars covering content
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />} // Use the custom tab bar
        screenOptions={{ headerShown: false }} // Hide default headers for tab screens
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="My Trips" component={MyTripsScreen} />
        <Tab.Screen name="Payment" component={PaymentScreen} />
        <Tab.Screen name="Help" component={HelpScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
    flexDirection: 'row',
    height: 60, // Standard height for bottom nav
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    // Shadow for Android
    elevation: 5,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  navItem: {
    flex: 1, // Each item takes equal space
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4, // Space between icon and label
  },
  // Added styles for placeholder screens
  tabScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA', // Match app background
  },
  tabText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E2022',
  },
});

export default DashboardScreen;
