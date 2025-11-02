import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Logout cancelled'),
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@user_token');
              await AsyncStorage.removeItem('@user_phone_number');
              navigation.reset({
                index: 0,
                routes: [{ name: 'AuthLoading' }],
              });
            } catch (e) {
              console.error('Failed to logout.', e);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.container}>
        <TouchableOpacity style={styles.menuItem}>
          <Icon
            name="person"
            size={24}
            color="#4A6CFF"
            style={styles.menuIcon}
          />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Icon name="chevron-right" size={24} color="#C7C7CD" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Referral')}
        >
          <Icon name="link" size={24} color="#4A6CFF" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Referral</Text>
          <Icon name="chevron-right" size={24} color="#C7C7CD" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MySubscription')}
        >
          <Icon
            name="workspace-premium"
            size={24}
            color="#4A6CFF"
            style={styles.menuIcon}
          />
          <Text style={styles.menuItemText}>My Subscription</Text>
          <Icon name="chevron-right" size={24} color="#C7C7CD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon
            name="security"
            size={24}
            color="#4A6CFF"
            style={styles.menuIcon}
          />
          <Text style={styles.menuItemText}>Account & Security</Text>
          <Icon name="chevron-right" size={24} color="#C7C7CD" />
        </TouchableOpacity>

        {/* --- Logout Button --- */}
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Icon
            name="logout"
            size={24}
            color="#D32F2F"
            style={styles.menuIcon}
          />
          <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
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
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1E2022',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#FFF1F2', // Light red
    borderColor: '#D32F2F', // Red border
    borderWidth: 1,
  },
  logoutText: {
    color: '#D32F2F', // Red text
    fontWeight: '600',
  },
});

export default ProfileScreen;
