import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Linking, TouchableOpacity, Animated, Platform } from 'react-native';
import axios from 'axios';

const IS_WEB = Platform.OS === 'web';

export default function CompanyInfo({ colors, apiBaseUrl, isActive, onScroll, isPublicWebView = false }) {
  const [stats, setStats] = useState({ totalUsers: 0 });
  const scrollRef = useRef(null);
  const apiHeaders = { headers: { 'ngrok-skip-browser-warning': 'true' } };
  const getGlassStyle = (variant = 'card') => {
    if (!isPublicWebView || !IS_WEB) {
      return {};
    }

    const darkMode = colors.mode === 'dark';
    const isShell = variant === 'shell';

    return {
      backgroundColor: darkMode
        ? isShell
          ? 'rgba(15, 23, 42, 0.34)'
          : 'rgba(15, 23, 42, 0.46)'
        : isShell
          ? 'rgba(255, 255, 255, 0.36)'
          : 'rgba(255, 255, 255, 0.62)',
      borderColor: darkMode ? 'rgba(148, 163, 184, 0.34)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: isShell ? 'blur(16px) saturate(138%)' : 'blur(14px) saturate(135%)',
      WebkitBackdropFilter: isShell ? 'blur(16px) saturate(138%)' : 'blur(14px) saturate(135%)',
      shadowColor: darkMode ? '#020617' : '#94a3b8',
      shadowOffset: { width: 0, height: isShell ? 18 : 10 },
      shadowOpacity: isShell ? 0.28 : 0.2,
      shadowRadius: isShell ? 30 : 20,
    };
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!apiBaseUrl) return;

      try {
        const response = await axios.get(`${apiBaseUrl}/stats/summary`, apiHeaders);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching company stats:', error);
      }
    };

    fetchStats();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (isActive) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isActive]);

  const appDetails = {
    name: 'Electripay',
    audience: 'Electricity consumers and account holders',
    purpose: 'A mobile billing companion for monitoring power usage and submitting payments.',
  };

  const contactInfo = [
    { label: 'Project Support', value: 'Electripay Help Desk', link: null },
    { label: 'Email', value: 'support@electripay.app', link: 'mailto:support@electripay.app' },
    { label: 'Help Hours', value: 'Mon-Fri, 8:00 AM to 6:00 PM', link: null },
    { label: 'Feedback', value: 'Send feature requests or issues by email', link: 'mailto:support@electripay.app' },
  ];

  const features = [
    { title: 'Dashboard Overview', description: 'Shows account profile, bill status, and customer information in one view.' },
    { title: 'Usage Monitoring', description: 'Displays weekly and monthly consumption so users can spot patterns quickly.' },
    { title: 'Payment Tracking', description: 'Generates a payment QR, accepts receipt uploads, and keeps a payment history log.' },
    { title: 'Mobile Access', description: 'Designed for phone-based account access using Expo and a MongoDB-backed API.' },
  ];

  const workflow = [
    'Log in with your account credentials.',
    'Review your current bill, usage summary, and recent payment activity.',
    'Scan or download the QR code to pay using your preferred wallet or banking app.',
    'Upload a receipt image so the payment can be marked for verification.',
  ];

  const benefits = [
    'Reduces the need to ask for bill updates manually.',
    'Keeps usage trends visible for smarter electricity decisions.',
    'Makes payment proof submission easier on mobile devices.',
    'Connects account data, usage data, and payment records in one app.',
  ];

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={[isPublicWebView ? styles.publicWebShell : null, getGlassStyle('shell')]}>
      <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, getGlassStyle()]}>

        <Text style={[styles.cardTitle, { color: colors.text }]}>What This Project Offers</Text>
        <Text style={[styles.cardText, { color: colors.text }]}>
          Electripay is a mobile application for customers who want a simpler way to manage electricity billing.
          It combines account details, current bill tracking, usage monitoring, and receipt-based payment submission
          into a single interface.
        </Text>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }, getGlassStyle()]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{stats.totalUsers}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Registered Users</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>QR Pay</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Fast bill payment access</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>Usage View</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Weekly and monthly tracking</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>Profile Tools</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Account and password controls</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, getGlassStyle()]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Core Features</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <View key={feature.title} style={[styles.featureBox, { backgroundColor: colors.surface, borderColor: colors.border }, getGlassStyle()]}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.mutedText }]}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, getGlassStyle()]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>How It Works</Text>
        {workflow.map((step) => (
          <Text key={step} style={[styles.cardText, { color: colors.text, marginBottom: 8 }]}>
            - {step}
          </Text>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, getGlassStyle()]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Why It Matters</Text>
        {benefits.map((benefit) => (
          <Text key={benefit} style={[styles.cardText, { color: colors.text, marginBottom: 8 }]}>
            - {benefit}
          </Text>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, getGlassStyle()]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Project Snapshot</Text>
        <Text style={[styles.commitmentText, { color: colors.text }]}>Audience: {appDetails.audience}</Text>
        <Text style={[styles.commitmentText, { color: colors.text }]}>Purpose: {appDetails.purpose}</Text>
        <Text style={[styles.commitmentText, { color: colors.text }]}>Frontend: React Native with Expo</Text>
        <Text style={[styles.commitmentText, { color: colors.text }]}>Backend: Express API with MongoDB</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, getGlassStyle()]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Support and Contact</Text>
        {contactInfo.map((contact) => (
          <TouchableOpacity
            key={contact.label}
            style={[styles.contactItem, { borderBottomColor: colors.border }]}
            onPress={() => contact.link && Linking.openURL(contact.link)}
            disabled={!contact.link}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactLabel, { color: colors.mutedText }]}>{contact.label}</Text>
              <Text style={[styles.contactValue, { color: contact.link ? colors.darkBlue : colors.text }]}>
                {contact.value}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.footerCard, { backgroundColor: colors.surface, borderColor: colors.border }, getGlassStyle()]}>
        <Text style={[styles.footerText, { color: colors.mutedText }]}>
          Copyright 2026 Electripay. Built to simplify electricity billing and payment tracking.
        </Text>
      </View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 30,
  },
  publicWebShell: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    marginTop: 10,
    overflow: 'hidden',
  },
  headerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  companyName: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 17,
    lineHeight: 20,
  },
  statsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureBox: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 14,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  commitmentText: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 6,
  },
  footerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
  },
});
