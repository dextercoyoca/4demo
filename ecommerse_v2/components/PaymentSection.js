import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import { showClientAlert } from '../utils/showClientAlert';

export default function PaymentSection({ colors, apiBaseUrl, user, isActive, onScroll }) {
  const [receipt, setReceipt] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [showRecentPayments, setShowRecentPayments] = useState(false);
  const scrollRef = useRef(null);
  const apiHeaders = { headers: { 'ngrok-skip-browser-warning': 'true' } };
  const getGlassCardStyle = (variant = 'base') => {
    const darkMode = colors.mode === 'dark';
    const isStrong = variant === 'strong';
    const bg = darkMode
      ? isStrong
        ? 'rgba(15, 23, 42, 0.46)'
        : 'rgba(15, 23, 42, 0.34)'
      : isStrong
        ? 'rgba(255, 255, 255, 0.66)'
        : 'rgba(255, 255, 255, 0.5)';

    return {
      backgroundColor: bg,
      borderColor: darkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(255, 255, 255, 0.72)',
      ...(Platform.OS === 'web'
        ? {
            backdropFilter: 'blur(14px) saturate(135%)',
            WebkitBackdropFilter: 'blur(14px) saturate(135%)',
          }
        : {}),
    };
  };

  const isInvalidApiPayload = (payload) =>
    typeof payload === 'string' &&
    (payload.startsWith('Tunnel') || payload.includes('ngrok') || payload.startsWith('<!DOCTYPE') || payload.startsWith('<html'));

  const fetchPayments = async () => {
    if (!apiBaseUrl || !user?._id) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${apiBaseUrl}/users/${user._id}/payments`, apiHeaders);
      if (isInvalidApiPayload(response.data)) {
        throw new Error('Tunnel is inactive or API URL is stale. Start a fresh tunnel and reload the app.');
      }
      setPaymentData(response.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      showClientAlert('Error', error?.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [apiBaseUrl, user?._id]);

  useEffect(() => {
    if (isActive) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isActive]);

  const bill = paymentData?.currentBill;
  const paymentHistory = paymentData?.history || [];
  const qrCodeUrl = bill
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
        bill.qrData
      )}`
    : null;

  const pickReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showClientAlert('Permission required', 'Allow access to gallery');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0].uri);
    }
  };

  const submitReceipt = async () => {
    if (!user?._id) {
      showClientAlert('Error', 'No user is logged in');
      return;
    }

    if (!receipt) {
      showClientAlert('No Receipt', 'Please upload a receipt first.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${apiBaseUrl}/users/${user._id}/payments/receipt`,
        { receiptUri: receipt }
        ,
        apiHeaders
      );
      if (isInvalidApiPayload(response.data) || !response.data?.payments) {
        throw new Error('Unexpected API response. Check tunnel/API base URL and try again.');
      }
      setPaymentData(response.data.payments);
      showClientAlert('Submitted', 'Receipt sent to admin for verification.');
    } catch (error) {
      console.error('Error submitting receipt:', error);
      showClientAlert('Error', error?.message || 'Failed to submit receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchPayments();
  };

  const handleDownloadQr = async () => {
    if (!qrCodeUrl) {
      return;
    }

    const fileName = `electripay-qr-${Date.now()}.png`;
    const tempFileUri = `${FileSystem.cacheDirectory}${fileName}`;

    try {
      setDownloadingQr(true);
      const downloadResult = await FileSystem.downloadAsync(qrCodeUrl, tempFileUri);

      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          showClientAlert('Download Cancelled', 'Folder access was not granted, so the QR code was not saved.');
          return;
        }

        const fileBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'image/png'
        );

        await FileSystem.writeAsStringAsync(destinationUri, fileBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        showClientAlert('QR Saved', 'The QR code has been downloaded to the folder you selected.');
        return;
      }

      const savedUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({
        from: downloadResult.uri,
        to: savedUri,
      });

      showClientAlert('QR Saved', `The QR code was saved inside the app files:\n${savedUri}`);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showClientAlert('Error', 'Failed to download the QR code');
    } finally {
      setDownloadingQr(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>Loading payment details...</Text>
      </View>
    );
  }

  if (!user?._id || !bill) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>Log in to view payment details.</Text>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.container}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={[styles.card, getGlassCardStyle('strong')]}>
        <Text style={[styles.title, { color: colors.text }]}>Current Bill</Text>
        <Text style={[styles.amount, { color: colors.accent }]}>PHP {bill.amount}</Text>
        <Text style={[styles.text, { color: colors.text }]}>Due Date: {bill.dueDate}</Text>
        <Text style={[styles.text, { color: colors.text }]}>Account #: {bill.accountNumber}</Text>
        <Text
          style={[
            styles.status,
            { color: bill.status === 'Completed' || bill.status === 'Paid' ? colors.success : colors.danger },
          ]}
        >
          Status: {bill.status}
        </Text>
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.title, { color: colors.text }]}>Pay via QR Code</Text>
        <Image
          source={{
            uri: qrCodeUrl,
          }}
          style={styles.qr}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent, opacity: downloadingQr ? 0.7 : 1 }]}
          onPress={handleDownloadQr}
          disabled={downloadingQr}
        >
          <Text style={{ color: colors.mode === 'dark' ? '#0b1020' : '#ffffff', fontWeight: 'bold' }}>
            {downloadingQr ? 'Downloading...' : 'Download QR Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.title, { color: colors.text }]}>Payment Instructions</Text>
        <Text style={[styles.step, { color: colors.text }]}>1. Open GCash, Maya, or your banking app</Text>
        <Text style={[styles.step, { color: colors.text }]}>2. Scan the QR code above</Text>
        <Text style={[styles.step, { color: colors.text }]}>3. Confirm the amount of PHP {bill.amount}</Text>
        <Text style={[styles.step, { color: colors.text }]}>4. Save or screenshot your receipt</Text>
        <Text style={[styles.step, { color: colors.text }]}>5. Upload the receipt below for verification</Text>
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.title, { color: colors.text }]}>Upload Payment Receipt</Text>

        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.accent }]}
          onPress={pickReceipt}
        >
          <Text style={{ color: colors.mode === 'dark' ? '#0b1020' : '#ffffff', fontWeight: 'bold' }}>Select Receipt Image</Text>
        </TouchableOpacity>

        {receipt && <Image source={{ uri: receipt }} style={styles.receiptPreview} />}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.darkBlue, opacity: submitting ? 0.7 : 1 }]}
          onPress={submitReceipt}
          disabled={submitting}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>
            {submitting ? 'Submitting...' : 'Submit Receipt'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleRefresh}>
          <Text style={[styles.linkText, { color: colors.darkBlue }]}>Refresh payment status</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, getGlassCardStyle('strong')]}>
        <TouchableOpacity
          style={styles.collapseHeader}
          onPress={() => setShowRecentPayments((value) => !value)}
        >
          <Text style={[styles.title, { color: colors.text, marginBottom: 0 }]}>
            Recent Payments
          </Text>
          <FontAwesome
            name={showRecentPayments ? 'angle-up' : 'caret-down'}
            size={16}
            color={colors.mutedText}
          />
        </TouchableOpacity>

        {showRecentPayments && paymentHistory.map((item) => (
          <View key={item.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.historyDate, { color: colors.text }]}>{item.date}</Text>
              <Text style={[styles.historyStatus, { color: colors.success }]}>{item.status}</Text>
              <Text style={[styles.historyMethod, { color: colors.mutedText }]}>{item.method}</Text>
            </View>

            <Text style={[styles.historyAmount, { color: colors.text }]}>PHP {item.amount}</Text>
          </View>
        ))}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: 'rgba(17, 29, 51, 0.4)',
    backdropFilter: 'blur(10px)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  amount: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 14, marginBottom: 4 },
  status: { fontWeight: 'bold', marginTop: 6 },
  qr: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginVertical: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  step: { fontSize: 13, marginBottom: 7, lineHeight: 20 },
  uploadButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  historyDate: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  historyStatus: { fontSize: 11, marginBottom: 2 },
  historyMethod: { fontSize: 11, marginBottom: 2 },
  historyAmount: { fontSize: 14, fontWeight: 'bold' },
});
