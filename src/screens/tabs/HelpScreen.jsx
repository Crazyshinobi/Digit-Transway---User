import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HELP_TOPICS = [
  { key: 'faq', title: 'Frequently Asked Questions', icon: 'quiz' },
  { key: 'contact', title: 'Contact Support', icon: 'support-agent' },
  { key: 'privacy', title: 'Privacy Policy', icon: 'shield' },
  { key: 'terms', title: 'Terms & Conditions', icon: 'description' },
];

const FAQ_ITEMS = [
  {
    id: 'q1',
    question: '1. Digit Transway LLP क्या है?',
    answer:
      'Digit Transway LLP एक digital platform है जो Fleet Owners, Drivers, और Brokers को connect करता है transportation services को transparent, efficient, और reliable बनाने के लिए।',
  },
  {
    id: 'q2',
    question: '2. यह app कौन use कर सकता है?',
    answer:
      'Fleet Owners जो अपनी vehicles को effectively manage करना चाहते हैं, Drivers जो fair opportunities और quick access to trips ढूंढ रहे हैं, और Brokers/Agents जो trusted fleet owners और verified drivers से connect होना चाहते हैं।',
  },
  {
    id: 'q3',
    question: '3. Digit Transway Fleet Owners की कैसे help करता है?',
    answer:
      'Fleet Owners को verified brokers मिल सकते हैं, trips quickly assign कर सकते हैं, vehicles को real time track कर सकते हैं, और empty runs reduce करके higher efficiency और profits ले सकते हैं।',
  },
  {
    id: 'q4',
    question: '4. क्या मेरा data safe है इस platform पर?',
    answer:
      'हां। हम data privacy और security को priority देते हैं — encrypted systems और strict policies के साथ यह ensure करने के लिए कि सभी user information safe रहे।',
  },
];

const HelpScreen = () => {
  const [openFaqId, setOpenFaqId] = useState(null);

  const handlePress = key => {
    switch (key) {
      case 'privacy':
        Linking.openURL('https://digittransway.in/privacy-policy.php');
        break;
      case 'terms':
        Linking.openURL('https://digittransway.in/terms.php');
        break;
      case 'contact':
        Linking.openURL('mailto:info@digittransway.com');
        break;
      case 'faq':
        // Toggle first FAQ section open if user taps the top-level FAQ menu
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenFaqId(openFaqId ? null : FAQ_ITEMS[0].id);
        break;
      default:
        break;
    }
  };

  const toggleFaq = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Block */}
        <View style={styles.welcomeContainer}>
          <Icon name="help-outline" size={60} color="#4A6CFF" />
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeSubtitle}>
            Browse our FAQs for quick answers or contact our support team
            directly.
          </Text>
        </View>

        {/* FAQ Accordion */}
        <View style={styles.faqContainer}>
          <Text style={styles.sectionTitle}>FAQs</Text>

          {FAQ_ITEMS.map(item => {
            const isOpen = openFaqId === item.id;
            return (
              <View key={item.id} style={styles.faqItem}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => toggleFaq(item.id)}
                  style={styles.faqQuestionRow}
                >
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Icon
                    name={isOpen ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#4A6CFF"
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Divider */}
        <View style={{ height: 12 }} />

        {/* Help Topics Menu */}
        {HELP_TOPICS.map(topic => (
          <TouchableOpacity
            key={topic.key}
            style={styles.menuItem}
            onPress={() => handlePress(topic.key)}
          >
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

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Can't find what you're looking for?
          </Text>
          <Text
            style={styles.footerContact}
            onPress={() => Linking.openURL('mailto:info@digittransway.com')}
          >
            Email us at info@digittransway.com
          </Text>

          {/* Office Info */}
          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={styles.officeTitle}>Head Office</Text>
            <Text style={styles.officeAddress}>
              38, TRANSPORT NAGAR, SEC-58,{'\n'}
              FARIDABAD, HARYANA - 121004
            </Text>
            <Text
              style={styles.officeContact}
              onPress={() => Linking.openURL('tel:9899333522')}
            >
              Contact: 9899333522
            </Text>
          </View>
        </View>
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

  // FAQ styles
  faqContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2022',
    marginBottom: 8,
  },
  faqItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    color: '#1E2022',
    fontWeight: '500',
    marginRight: 8,
  },
  faqAnswerContainer: {
    paddingHorizontal: 6,
    paddingBottom: 14,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#555B6A',
    lineHeight: 20,
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
  officeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2022',
    marginBottom: 4,
  },
  officeAddress: {
    fontSize: 14,
    color: '#777E90',
    textAlign: 'center',
    lineHeight: 20,
  },
  officeContact: {
    fontSize: 14,
    color: '#4A6CFF',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default HelpScreen;