import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import CustomRefreshScrollView from '../../components/CustomRefreshScrollView';
import { useThemeContext } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InboxScreen() {
  const { colors, activeTheme } = useThemeContext();
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusToast, setShowStatusToast] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    const startTime = Date.now();
    try {
      // Simulate checking development status
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((res) => setTimeout(res, 1000 - elapsed));
      }
      setRefreshing(false);
    }
  };

  const isDark = activeTheme === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <CustomRefreshScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textMain }]}>Kotak Masuk</Text>
            <Text style={[styles.headerSubTitle, { color: colors.textMuted }]}>
              Tata Persuratan & Disposisi Dinas
            </Text>
          </View>
          <View style={[
            styles.headerBadge,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
            }
          ]}>
            <View style={styles.badgePulseDot} />
            <Text style={[styles.headerBadgeText, { color: '#D97706' }]}>Tahap R&D</Text>
          </View>
        </View>

        {/* Status Toast when refreshed */}
        {showStatusToast && (
          <View style={[styles.toastContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: '#F59E0B' }]}>
            <Ionicons name="information-circle" size={18} color="#F59E0B" />
            <Text style={[styles.toastText, { color: colors.textMain }]}>
              Modul masih dalam tahap pengerjaan & sinkronisasi data.
            </Text>
          </View>
        )}

        {/* Hero Card: Under Development Notice */}
        <View style={[
          styles.heroCardContainer,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
          }
        ]}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.02)']
                : ['#FFFBEB', '#FFFFFF']
            }
            style={styles.heroCardGradient}
          >
            {/* Glowing Icon Frame */}
            <View style={styles.heroIconWrapper}>
              <View style={[
                styles.heroIconOuterGlow,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7' }
              ]}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.heroIconInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="mail" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.subIconBadge}>
                <Ionicons name="construct" size={14} color="#FFFFFF" />
              </View>
            </View>

            {/* Development Pill Tag */}
            <View style={[
              styles.devPillTag,
              {
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
              }
            ]}>
              <Ionicons name="hammer-outline" size={12} color="#D97706" />
              <Text style={styles.devPillText}>DALAM TAHAP PENGEMBANGAN</Text>
            </View>

            {/* Title */}
            <Text style={[styles.heroTitle, { color: colors.textMain }]}>
              Modul Tata Persuratan & Disposisi
            </Text>

            {/* Narrative Explanation */}
            <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
              Tata kelola persuratan dinas, alur disposisi pimpinan berjenjang, dan verifikasi tanda tangan digital membutuhkan integrasi regulasi birokrasi serta keamanan yang tinggi.
            </Text>

            <View style={[
              styles.highlightQuoteBox,
              {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              }
            ]}>
              <Ionicons name="bulb-outline" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
              <Text style={[styles.highlightQuoteText, { color: colors.textMain }]}>
                Modul ini saat ini sedang dipersiapkan dan dikembangkan secara bertahap agar siap digunakan dengan aman, rapi, dan optimal.
              </Text>
            </View>

            {/* Roadmap / Progress Bar */}
            <View style={[styles.progressSection, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
              <View style={styles.progressHeaderRow}>
                <Text style={[styles.progressTitle, { color: colors.textMain }]}>Status Pengerjaan</Text>
                <Text style={styles.progressPercentage}>Fase 2 / 3</Text>
              </View>

              {/* Bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                <LinearGradient
                  colors={['#F59E0B', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: '68%' }]}
                />
              </View>

              {/* Timeline Steps */}
              <View style={styles.stepsRow}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.stepLabel, { color: colors.textMuted }]}>Analisis & Alur</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.stepLabel, { color: '#F59E0B', fontWeight: '800' }]}>Integrasi Teknis</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
                  <Text style={[styles.stepLabel, { color: colors.textMuted }]}>Rilis Publik</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Section: Upcoming Features */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="sparkles" size={16} color={colors.teal} />
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Fitur yang Sedang Disiapkan</Text>
        </View>

        <View style={styles.featureGrid}>
          {/* Feature 1: Surat Masuk */}
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.featureIconBox, { backgroundColor: isDark ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1' }]}>
              <Ionicons name="mail-unread-outline" size={20} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureCardTitle, { color: colors.textMain }]}>Surat Masuk Digital</Text>
              <Text style={[styles.featureCardDesc, { color: colors.textMuted }]}>
                Penerimaan arsip surat resmi dinas dengan notifikasi instan langsung ke perangkat.
              </Text>
            </View>
          </View>

          {/* Feature 2: Disposisi */}
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.featureIconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
              <Ionicons name="git-branch-outline" size={20} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureCardTitle, { color: colors.textMain }]}>Disposisi Berjenjang</Text>
              <Text style={[styles.featureCardDesc, { color: colors.textMuted }]}>
                Penerusan instruksi dan catatan penugasan resmi dari pimpinan ke staf secara terstruktur.
              </Text>
            </View>
          </View>

          {/* Feature 3: Digital Signature */}
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.featureIconBox, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureCardTitle, { color: colors.textMain }]}>Tanda Tangan & QR Validator</Text>
              <Text style={[styles.featureCardDesc, { color: colors.textMuted }]}>
                Verifikasi keabsahan dokumen kedinasan berbasis kode QR dan autentikasi digital.
              </Text>
            </View>
          </View>

          {/* Feature 4: Tracking */}
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.featureIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
              <Ionicons name="time-outline" size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureCardTitle, { color: colors.textMain }]}>Pelacakan Ekspedisi Surat</Text>
              <Text style={[styles.featureCardDesc, { color: colors.textMuted }]}>
                Monitoring status alur perjalanan surat dinas secara transparan dan terdata.
              </Text>
            </View>
          </View>
        </View>

        {/* Office Contact Notice Box */}
        <View style={[
          styles.contactNoticeCard,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
            borderColor: colors.border,
          }
        ]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.contactNoticeText, { color: colors.textMuted }]}>
            Untuk kebutuhan tata persuratan mendesak, silakan berkoordinasi langsung dengan Sub Bagian Tata Usaha / Sekretariat melalui saluran dinas internal.
          </Text>
        </View>

        {/* Action Button: Kembali ke Beranda */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/home')}
          style={styles.actionBtnWrapper}
        >
          <LinearGradient
            colors={[colors.teal, '#0F766E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtnGradient}
          >
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Kembali ke Beranda</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Spacer for bottom navigation bar */}
        <View style={{ height: 120 }} />
      </CustomRefreshScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  heroCardContainer: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  heroCardGradient: {
    padding: 22,
    alignItems: 'center',
  },
  heroIconWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  heroIconOuterGlow: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  subIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#EA580C',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  devPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  devPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  heroDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  highlightQuoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    marginBottom: 16,
  },
  highlightQuoteText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    flex: 1,
  },
  progressSection: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercentage: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  featureGrid: {
    gap: 10,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureCardDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  contactNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  contactNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  actionBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
