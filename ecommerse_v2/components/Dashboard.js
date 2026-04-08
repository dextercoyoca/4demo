import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import { showClientAlert } from '../utils/showClientAlert';

export default function Dashboard({ colors, apiBaseUrl, user, isActive, onScroll, onLogout, onUserRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeFaq, setActiveFaq] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    address: '',
    contact: '',
    avatar: 'https://www.pngmart.com/files/23/Profile-PNG-Photo.png',
  });
  const faqItems = [
    {
      id: 'faq-1',
      question: 'How do I know if my payment was received?',
      answer: 'After submitting your receipt, refresh your payment status. Once verified, your bill status changes to Paid or Completed.',
    },
    {
      id: 'faq-2',
      question: 'What should I do if I forgot my password?',
      answer: 'Use the Forgot Password option in the login modal, provide your account details, then set your new password.',
    },
    {
      id: 'faq-3',
      question: 'Can I update my profile information?',
      answer: 'Yes. Open Profile, tap the edit icon, update your details, then tap Save at the bottom.',
    },
    {
      id: 'faq-4',
      question: 'Who do I contact during an electrical emergency?',
      answer: 'Go to the Maintenance tab for emergency hotlines and available utility personnel contacts.',
    },
  ];
  const getGlassContainerStyle = () => {
    const darkMode = colors.mode === 'dark';

    return {
      backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.62)',
      borderColor: darkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(255, 255, 255, 0.74)',
      ...(Platform.OS === 'web'
        ? {
            backdropFilter: 'blur(14px) saturate(135%)',
            WebkitBackdropFilter: 'blur(14px) saturate(135%)',
          }
        : {}),
    };
  };

  const mapUserToProfile = (userData) => ({
    name: userData.name || userData.username || '',
    email: userData.email || '',
    address: userData.address || userData.Address || '',
    contact: userData.contact || userData.contactNumber || '',
    avatar:
      userData.avatar ||
      userData.profilePic ||
      'https://www.pngmart.com/files/23/Profile-PNG-Photo.png',
  });

  const isInvalidApiPayload = (payload) =>
    typeof payload === 'string' &&
    (payload.startsWith('Tunnel') || payload.includes('ngrok') || payload.startsWith('<!DOCTYPE') || payload.startsWith('<html'));

  const apiHeaders = { headers: { 'ngrok-skip-browser-warning': 'true' } };

  useEffect(() => {
    if (!apiBaseUrl || !user?._id) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/users/${user._id}`, apiHeaders);
        if (isInvalidApiPayload(response.data)) {
          throw new Error('Tunnel is inactive or API URL is stale. Start a fresh tunnel and reload the app.');
        }
        setProfile(mapUserToProfile(response.data));
      } catch (error) {
        console.error('Error fetching profile:', error);
        showClientAlert('Error', error?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [apiBaseUrl, user?._id]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showClientAlert('Permission required', 'Allow access to gallery');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfile({
        ...profile,
        avatar: result.assets[0].uri,
      });
    }
  };

  const handleSave = async () => {
    if (!apiBaseUrl || !user?._id) {
      showClientAlert('Error', 'No user is logged in');
      return;
    }

    try {
      await axios.put(`${apiBaseUrl}/users/${user._id}`, profile, apiHeaders);
      onUserRefresh?.(profile);
      setIsEditing(false);
      showClientAlert('Saved', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      showClientAlert('Error', 'Failed to save profile');
    }
  };

  const handleChangePassword = async () => {
    if (!apiBaseUrl || !user?._id) {
      showClientAlert('Error', 'No user is logged in');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showClientAlert('Error', 'Please complete the password form');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showClientAlert('Error', 'New password confirmation does not match');
      return;
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/users/${user._id}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, apiHeaders);
      showClientAlert('Success', response.data.message);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      showClientAlert('Error', error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.darkBg }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={[styles.mainContainer, getGlassContainerStyle()]}>
        <View style={styles.sectionBlock}>
          <View style={styles.profileHeader}>
            <Text style={[styles.profileTitle, { color: colors.text }]}>Profile</Text>

            {!isEditing ? (
              <TouchableOpacity style={styles.iconActionButton} onPress={() => setIsEditing(true)}>
                <FontAwesome name="ellipsis" size={24} color={colors.accent} />
              </TouchableOpacity>
            ) : (
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.iconActionButton} onPress={handleCancelEdit}>
                  <FontAwesome name="xmark" size={24} color={colors.mutedText} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={isEditing ? pickImage : null}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            </TouchableOpacity>
            {isEditing && (
              <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 6 }}>
                Tap image to change
              </Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Name:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={profile.name}
                placeholderTextColor={colors.mutedText}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.name}</Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Email:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={profile.email}
                placeholderTextColor={colors.mutedText}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.email}</Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Address:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={profile.address}
                placeholderTextColor={colors.mutedText}
                onChangeText={(text) => setProfile({ ...profile, address: text })}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.address}</Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Contact:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={profile.contact}
                placeholderTextColor={colors.mutedText}
                onChangeText={(text) => setProfile({ ...profile, contact: text })}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.contact}</Text>
            )}
          </View>

          {isEditing && (
            <>
              <View style={styles.passwordForm}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="Current Password"
                  placeholderTextColor={colors.mutedText}
                  secureTextEntry
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                />
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="New Password"
                  placeholderTextColor={colors.mutedText}
                  secureTextEntry
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                />
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="Confirm New Password"
                  placeholderTextColor={colors.mutedText}
                  secureTextEntry
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                />
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={handleChangePassword}>
                  <Text style={{ color: colors.darkBg, fontWeight: 'bold' }}>Update Password</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.saveBottomButton, { backgroundColor: colors.accent }]}
                onPress={handleSave}
              >
                <FontAwesome
                  name="check"
                  size={18}
                  color={colors.mode === 'dark' ? '#0b1020' : '#ffffff'}
                />
                <Text style={[styles.saveBottomButtonText, { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Session</Text>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.darkBlue }]} onPress={onLogout}>
            <Text style={{ color: colors.white, fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>FAQ</Text>
          {faqItems.map((item) => {
            const expanded = activeFaq === item.id;
            return (
              <View key={item.id} style={[styles.faqItem, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setActiveFaq((current) => (current === item.id ? null : item.id))}
                >
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                  <Text style={[styles.faqToggle, { color: colors.mutedText }]}>{expanded ? '-' : '+'}</Text>
                </TouchableOpacity>
                {expanded && (
                  <Text style={[styles.faqAnswer, { color: colors.mutedText }]}>{item.answer}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    backgroundColor: 'rgba(17, 29, 51, 0.4)',
    backdropFilter: 'blur(10px)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  sectionBlock: {
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileTitle: { fontSize: 20, fontWeight: '800' },
  editButtons: { flexDirection: 'row' },
  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  profileField: { marginBottom: 12 },
  fieldLabel: { fontWeight: '600', marginBottom: 4 },
  fieldValue: { flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(11, 30, 46, 0.15)',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  passwordForm: {
    marginTop: 8,
    marginBottom: 10,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  saveBottomButton: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  saveBottomButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  faqToggle: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 14,
    textAlign: 'center',
  },
  faqAnswer: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
});
