import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';

export default function UsageSection({ colors, apiBaseUrl, user, isActive, onScroll }) {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllMonths, setShowAllMonths] = useState(false);
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

  useEffect(() => {
    const fetchUsage = async () => {
      if (!apiBaseUrl || !user?._id) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${apiBaseUrl}/users/${user._id}/usage`, apiHeaders);
        if (
          typeof response.data === 'string' &&
          (response.data.startsWith('Tunnel') ||
            response.data.includes('ngrok') ||
            response.data.startsWith('<!DOCTYPE') ||
            response.data.startsWith('<html'))
        ) {
          throw new Error('Tunnel is inactive or API URL is stale. Start a fresh tunnel and reload the app.');
        }
        setUsageData(response.data);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [apiBaseUrl, user?._id]);

  useEffect(() => {
    if (isActive) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isActive]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>Loading usage data...</Text>
      </View>
    );
  }

  if (!user?._id || !usageData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>Log in to view usage data.</Text>
      </View>
    );
  }

  const weekly = usageData.weekly || [];
  const monthly = usageData.monthly || [];
  const visibleMonthly = showAllMonths ? monthly : monthly.slice(-3);
  const maxUsage = Math.max(...weekly.map((item) => item.usage), 1);
  const minUsage = Math.min(...weekly.map((item) => item.usage), maxUsage);
  const averageUsage = usageData.summary?.dailyAverage || 0;
  const chartScale = [maxUsage, Math.max(Math.round(maxUsage * 0.66), 1), Math.max(Math.round(maxUsage * 0.33), 1)];
  const isWeb = Platform.OS === 'web';

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
      <View style={[styles.card, styles.chartCard, getGlassCardStyle('strong')]}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Usage Pattern</Text>
            <Text style={[styles.chartSubtitle, { color: colors.mutedText }]}>
              {isWeb ? 'A cleaner week-by-week desktop view of household consumption.' : 'Track how daily usage shifts across the week.'}
            </Text>
          </View>
          <View style={[styles.chartBadge, getGlassCardStyle()]}>
            <Text style={[styles.chartBadgeLabel, { color: colors.mutedText }]}>Avg</Text>
            <Text style={[styles.chartBadgeValue, { color: colors.text }]}>{averageUsage} kWh</Text>
          </View>
        </View>

        <View style={styles.chartMetaRow}>
          <View style={[styles.chartMetaCard, getGlassCardStyle()]}>
            <Text style={[styles.chartMetaLabel, { color: colors.mutedText }]}>Peak</Text>
            <Text style={[styles.chartMetaValue, { color: colors.text }]}>{maxUsage} kWh</Text>
          </View>
          <View style={[styles.chartMetaCard, getGlassCardStyle()]}>
            <Text style={[styles.chartMetaLabel, { color: colors.mutedText }]}>Low</Text>
            <Text style={[styles.chartMetaValue, { color: colors.text }]}>{minUsage} kWh</Text>
          </View>
        </View>

        <View style={styles.chartShell}>
          <View style={styles.chartScale}>
            {chartScale.map((value) => (
              <Text key={value} style={[styles.chartScaleLabel, { color: colors.mutedText }]}>
                {value}
              </Text>
            ))}
            <Text style={[styles.chartScaleLabel, { color: colors.mutedText }]}>0</Text>
          </View>

          <View style={styles.chartArea}>
            {chartScale.map((value) => (
              <View key={`line-${value}`} style={[styles.chartGuide, { borderBottomColor: colors.border }]} />
            ))}
            <View style={[styles.chartGuide, styles.chartGuideBase, { borderBottomColor: colors.border }]} />

            <View style={styles.chartBarsRow}>
              {weekly.map((item) => (
                <View key={item.day} style={styles.barWrapper}>
                  <Text style={[styles.barValue, { color: colors.text }]}>{item.usage}</Text>
                  <View style={[styles.barTrack, getGlassCardStyle()]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max((item.usage / maxUsage) * 100, 8)}%`,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedText }]}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Current Week Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statsItem}>
            <Text style={[styles.statsLabel, { color: colors.mutedText }]}>Total Usage</Text>
            <Text style={[styles.statsValue, { color: colors.accent }]}>
              {usageData.summary.totalUsage} kWh
            </Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={[styles.statsLabel, { color: colors.mutedText }]}>Daily Avg</Text>
            <Text style={[styles.statsValue, { color: colors.accent }]}>
              {usageData.summary.dailyAverage} kWh
            </Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={[styles.statsLabel, { color: colors.mutedText }]}>Peak Day</Text>
            <Text style={[styles.statsValue, { color: colors.accent }]}>
              {usageData.summary.peakDay.day} ({usageData.summary.peakDay.usage})
            </Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={[styles.statsLabel, { color: colors.mutedText }]}>Low Day</Text>
            <Text style={[styles.statsValue, { color: colors.accent }]}>
              {usageData.summary.lowDay.day} ({usageData.summary.lowDay.usage})
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, getGlassCardStyle('strong')]}>
        <View style={styles.headerRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Comparison</Text>
          <TouchableOpacity style={[styles.button, getGlassCardStyle()]} onPress={() => setShowAllMonths((value) => !value)}>
            <FontAwesome
              name={showAllMonths ? 'angle-up' : 'caret-down'}
              size={16}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {visibleMonthly.map((item) => (
          <View key={item.month} style={[styles.monthRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.monthName, { color: colors.text }]}>{item.month}</Text>
              <Text style={[styles.monthUsage, { color: colors.mutedText }]}>
                {item.usage} kWh
              </Text>
            </View>
            <Text style={[styles.monthCost, { color: colors.accent, fontWeight: 'bold' }]}>
              PHP {item.cost}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, getGlassCardStyle()]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Efficiency Tips</Text>
        {usageData.tips.map((tip) => (
          <Text key={tip} style={[styles.tipText, { color: colors.text }]}>
            - {tip}
          </Text>
        ))}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    width: 42,
    height: 42,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingBottom: 20,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: 'rgba(17, 29, 51, 0.4)',
    backdropFilter: 'blur(10px)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  chartCard: {
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 14,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
  },
  chartSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 460,
    marginTop: -8,
  },
  chartBadge: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 88,
  },
  chartBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chartBadgeValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  chartMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  chartMetaCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chartMetaLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  chartMetaValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  chartShell: {
    flexDirection: 'row',
    minHeight: 260,
  },
  chartScale: {
    width: 34,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingBottom: 30,
  },
  chartScaleLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartGuide: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
  },
  chartGuideBase: {
    bottom: 30,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingVertical: 16,
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    height: 230,
    paddingTop: 12,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    maxWidth: 56,
    height: 170,
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: 'flex-end',
    padding: 6,
    marginBottom: 10,
  },
  bar: {
    width: '100%',
    borderRadius: 12,
    minHeight: 12,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsItem: {
    width: '48%',
    marginBottom: 12,
    paddingVertical: 8,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthUsage: {
    fontSize: 11,
  },
  monthCost: {
    fontSize: 14,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 8,
  },
});
