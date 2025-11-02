import { View, Text, StyleSheet } from 'react-native';

const Snackbar = ({ message, visible, type }) => {
  if (!visible) return null;

  return (
    <View
      style={[
        styles.snackbar,
        type === 'error' ? styles.snackbarError : styles.snackbarSuccess,
      ]}
    >
      <Text style={styles.snackbarText}>{message}</Text>
    </View>
  );
};

export default Snackbar;

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    top: 45,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
  snackbarSuccess: {
    backgroundColor: '#039855',
  },
  snackbarError: {
    backgroundColor: '#D92D20',
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
