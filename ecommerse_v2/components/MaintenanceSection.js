import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import { showClientAlert } from '../utils/showClientAlert';

export default function MaintenanceSection({ colors }) {
  const personnel = useMemo(
    () => [
      {
        id: 'p1',
        name: 'Engr. Ramon Dela Cruz',
        role: 'Line Maintenance Supervisor',
        area: 'North District',
        contact: '+63 917 801 2201',
        status: 'Available',
      },
      {
        id: 'p2',
        name: 'Tech. Liza Santos',
        role: 'Emergency Response Technician',
        area: 'Central District',
        contact: '+63 917 801 2202',
        status: 'On Call',
      },
      {
        id: 'p3',
        name: 'Tech. Noel Garcia',
        role: 'Transformer & Meter Specialist',
        area: 'South District',
        contact: '+63 917 801 2203',
        status: 'Available',
      },
    ],
    []
  );

  const hotlines = useMemo(
    () => [
      { id: 'h1', label: '24/7 Utility Hotline', value: '+63 2 8888 1000' },
      { id: 'h2', label: 'Emergency Dispatch', value: '+63 917 700 1000' },
      { id: 'h3', label: 'Billing & Service Desk', value: '+63 2 8777 2100' },
    ],
    []
  );

  const reportEmail = 'support@electripay.app';

  const handleCall = async (phone) => {
    const sanitized = String(phone || '').replace(/[^\d+]/g, '');
    const url = `tel:${sanitized}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showClientAlert('Unavailable', `Calling is not supported on this device.\nContact: ${phone}`);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showClientAlert('Call Failed', `Unable to start call.\nContact: ${phone}`);
    }
  };

  const handleEmailReport = async () => {
    const subject = encodeURIComponent('Service Concern Report');
    const body = encodeURIComponent(
      'Please describe your concern:\n\nType of issue:\nLocation:\nUrgency (Minor/Major/Emergency):\nDetails:\n'
    );
    const url = `mailto:${reportEmail}?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showClientAlert('Unavailable', `Email app is not available.\nPlease contact: ${reportEmail}`);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showClientAlert('Report Failed', `Unable to open email app.\nPlease contact: ${reportEmail}`);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Available') return colors.success;
    if (status === 'On Call') return colors.accent;
    return colors.mutedText;
  };

  const getGlassCardStyle = () => {
    const darkMode = colors.mode === 'dark';
    return {
      backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.34)' : 'rgba(255, 255, 255, 0.54)',
      borderColor: darkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(255, 255, 255, 0.72)',
      ...(Platform.OS === 'web'
        ? {
            backdropFilter: 'blur(14px) saturate(135%)',
            WebkitBackdropFilter: 'blur(14px) saturate(135%)',
          }
        : {}),
    };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.title, { color: colors.text }]}>Maintenance & Emergency</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Contact utility personnel for minor to major issues. For life-threatening emergencies, call local emergency services immediately.
        </Text>
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Hotlines</Text>
        {hotlines.map((item) => (
          <View key={item.id} style={[styles.hotlineRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hotlineLabel, { color: colors.mutedText }]}>{item.label}</Text>
              <Text style={[styles.hotlineValue, { color: colors.text }]}>{item.value}</Text>
            </View>
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.accent }]} onPress={() => handleCall(item.value)}>
              <FontAwesome name="phone" size={14} color={colors.mode === 'dark' ? '#0b1020' : '#ffffff'} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Utility Personnel</Text>
        {personnel.map((member) => (
          <View key={member.id} style={[styles.personRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.personName, { color: colors.text }]}>{member.name}</Text>
              <Text style={[styles.personMeta, { color: colors.mutedText }]}>{member.role}</Text>
              <Text style={[styles.personMeta, { color: colors.mutedText }]}>Coverage: {member.area}</Text>
              <Text style={[styles.personMeta, { color: getStatusColor(member.status) }]}>Status: {member.status}</Text>
            </View>
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.darkBlue }]} onPress={() => handleCall(member.contact)}>
              <FontAwesome name="phone" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Report a Concern</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Send a report for outage, low voltage, sparking wires, meter issues, or billing-related concerns.
        </Text>
        <TouchableOpacity style={[styles.reportBtn, { backgroundColor: colors.accent }]} onPress={handleEmailReport}>
          <FontAwesome name="triangle-exclamation" size={14} color={colors.mode === 'dark' ? '#0b1020' : '#ffffff'} />
          <Text style={[styles.reportBtnText, { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' }]}>Report via Email</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  hotlineLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  hotlineValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  personName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  personMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  reportBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

