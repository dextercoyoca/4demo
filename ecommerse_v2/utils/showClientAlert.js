import { Alert, Platform } from 'react-native';

export const showClientAlert = (title, message = '') => {
  const safeTitle = typeof title === 'string' && title.trim() ? title : 'Notice';
  const safeMessage = typeof message === 'string' ? message : String(message ?? '');
  const content = safeMessage ? `${safeTitle}\n\n${safeMessage}` : safeTitle;

  if (Platform.OS === 'web') {
    try {
      const webAlert =
        (typeof globalThis !== 'undefined' && typeof globalThis.alert === 'function' && globalThis.alert) ||
        (typeof window !== 'undefined' && typeof window.alert === 'function' && window.alert);

      if (webAlert) {
        webAlert(content);
        return;
      }
    } catch (error) {
      // Fallbacks below
    }

    try {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        window.confirm(content);
        return;
      }
    } catch (error) {
      // Fall through to React Native Alert
    }
  }

  Alert.alert(safeTitle, safeMessage);
};
