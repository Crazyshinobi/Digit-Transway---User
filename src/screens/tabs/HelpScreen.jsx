import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const HELP_TOPICS = [
  { key: 'faq', title: 'Frequently Asked Questions', icon: 'quiz' },
  { key: 'contact', title: 'Contact Support', icon: 'support-agent' },
  { key: 'privacy', title: 'Privacy Policy', icon: 'shield' },
  { key: 'terms', title: 'Terms & Conditions', icon: 'description' },
];

const HelpScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* --- Added Content Block --- */}
        <View style={styles.welcomeContainer}>
          <Icon name="help-outline" size={60} color="#4A6CFF" />
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeSubtitle}>
            Browse our FAQs for quick answers or contact our support team
            directly.
          </Text>
        </View>
        {/* --- End of Added Content --- */}

        {HELP_TOPICS.map(topic => (
          <TouchableOpacity key={topic.key} style={styles.menuItem}>
            <Icon
              name={topic.icon}
              size={24}
              color="#4A6CFF"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>{topic.title}</Text>
            <Icon name="chevron-right" size={24} color="#C7C7CD" />
          </TouchableOpacity>
        ))}

        {/* --- Added Footer Block --- */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Can't find what you're looking for?
          </Text>
          <Text style={styles.footerContact}>
            Email us at support@digittransway.com
          </Text>
        </View>
        {/* --- End of Added Footer --- */}
        
      </ScrollView>
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
  // --- Styles for new welcome section ---
  welcomeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E2022',
    marginTop: 10,
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#777E90',
    textAlign: 'center',
  },
  // --- End of new styles ---
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
  // --- Styles for new footer section ---
  footerContainer: {
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    color: '#777E90',
  },
  footerContact: {
    fontSize: 14,
    color: '#4A6CFF',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default HelpScreen;