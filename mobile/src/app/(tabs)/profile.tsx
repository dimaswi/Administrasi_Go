import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import CustomRefreshScrollView from '../../components/CustomRefreshScrollView';
import { useThemeContext } from '../../context/ThemeContext';
import { getApiUrl } from '../../config/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen() {
  const { colors, activeTheme } = useThemeContext();
  const [refreshing, setRefreshing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const [userInfo, setUserInfo] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [jobCategoryName, setJobCategoryName] = useState<string>('');
  const [orgUnitName, setOrgUnitName] = useState<string>('');
  const [employmentStatusName, setEmploymentStatusName] = useState<string>('');

  const loadProfileData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // 1. Get Current User Info
      const meRes = await fetch(getApiUrl('/api/auth/me'), { headers });
      if (!meRes.ok) throw new Error('Unauthorized');
      const meData = await meRes.json();
      setUserInfo(meData.user);

      const userId = meData.user.id;

      // 2. Get Employee Detail by User ID
      const empRes = await fetch(getApiUrl(`/api/employees/by-user/${userId}`), { headers });
      if (empRes.ok) {
        const empJson = await empRes.json();
        const empData = empJson.data || empJson;
        setEmployee(empData);

        // Fetch Job Category
        if (empData.job_category_id) {
          try {
            const jcRes = await fetch(getApiUrl(`/api/job-categories/${empData.job_category_id}`), { headers });
            if (jcRes.ok) {
              const jcJson = await jcRes.json();
              setJobCategoryName((jcJson.data || jcJson).name || '');
            }
          } catch (e) { }
        }

        // Fetch Org Unit
        if (empData.organization_unit_id) {
          try {
            const orgRes = await fetch(getApiUrl(`/api/org-units/${empData.organization_unit_id}`), { headers });
            if (orgRes.ok) {
              const orgJson = await orgRes.json();
              setOrgUnitName((orgJson.data || orgJson).name || '');
            }
          } catch (e) { }
        }

        // Fetch Employment Status
        if (empData.employment_status_id) {
          try {
            const esRes = await fetch(getApiUrl(`/api/employment-statuses/${empData.employment_status_id}`), { headers });
            if (esRes.ok) {
              const esJson = await esRes.json();
              setEmploymentStatusName((esJson.data || esJson).name || '');
            }
          } catch (e) { }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const startTime = Date.now();
    try {
      await loadProfileData();
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

  const handleLogout = () => {
    Alert.alert(
      'Keluar dari Aplikasi',
      'Apakah Anda yakin ingin mengakhiri sesi login ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar Sesi',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('userToken');
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const fullName = employee
    ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
    : userInfo?.name || 'Loading...';

  const position = employee?.position || jobCategoryName || 'Pegawai';
  const nip = employee?.employee_id || userInfo?.nip || '-';
  const avatarUri = employee?.photo || 'https://i.pravatar.cc/150?img=11';

  const formatEmbossedNip = (str: string) => {
    if (!str || str === '-') return '•••• •••• •••• ••••';
    const clean = str.replace(/\D/g, '');
    if (!clean) return str;
    return clean.match(/.{1,4}/g)?.join(' ') || str;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <CustomRefreshScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textMain }]}>Profil Pegawai</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Smart ID Card & Identitas Resmi
            </Text>
          </View>
          <View style={[styles.statusBadgeHead, { backgroundColor: colors.statusOnsiteBg }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.statusOnsiteText }]} />
            <Text style={[styles.statusHeadText, { color: colors.statusOnsiteText }]}>Aktif</Text>
          </View>
        </View>

        {/* ATM Smart ID Card (Clickable to open Drawer) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setShowDrawer(true)}
          style={styles.atmCardContainer}
        >
          <LinearGradient
            colors={
              activeTheme === 'dark'
                ? ['#0F172A', '#1E293B', '#0A7973']
                : ['#0A7973', '#115E59', '#0F172A']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.atmCardGradient}
          >
            {/* Card Background Geometric Shine Lines */}
            <View style={styles.cardShinePattern} />



            {/* Middle Bar: EMV Chip & Holographic Badge */}
            <View style={styles.cardMiddleRow}>
              <View style={styles.emvChipBox}>
                <View style={styles.chipLineHorizontal} />
                <View style={styles.chipLineVertical} />
              </View>
              <View style={styles.hologramBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
              </View>
            </View>

            {/* Embossed NIP Number */}
            <Text style={styles.embossedNipText}>{formatEmbossedNip(nip)}</Text>

            {/* Bottom Bar: Name, Role & Avatar */}
            <View style={styles.cardBottomRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.cardHolderLabel}>NAMA PEGAWAI</Text>
                <Text style={styles.cardHolderName} numberOfLines={1}>{fullName.toUpperCase()}</Text>

                <View style={styles.cardRoleRow}>
                  <Text style={styles.cardRoleText} numberOfLines={1}>{position}</Text>
                  {!!orgUnitName && <Text style={styles.cardOrgText} numberOfLines={1}> • {orgUnitName}</Text>}
                </View>
              </View>

              <View style={styles.cardAvatarFrame}>
                <Image source={{ uri: avatarUri }} style={styles.cardAvatarImage} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Executive Summary Card on Screen */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryCardTitle, { color: colors.textMain }]}>Ringkasan Pegawai</Text>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryGridItem, { backgroundColor: colors.bg }]}>
              <Ionicons name="id-card-outline" size={18} color={colors.teal} />
              <Text style={[styles.summaryGridLabel, { color: colors.textMuted }]}>NIP / ID</Text>
              <Text style={[styles.summaryGridValue, { color: colors.textMain }]} numberOfLines={1}>{nip}</Text>
            </View>

            <View style={[styles.summaryGridItem, { backgroundColor: colors.bg }]}>
              <Ionicons name="ribbon-outline" size={18} color={colors.teal} />
              <Text style={[styles.summaryGridLabel, { color: colors.textMuted }]}>JABATAN</Text>
              <Text style={[styles.summaryGridValue, { color: colors.textMain }]} numberOfLines={1}>{position}</Text>
            </View>

            <View style={[styles.summaryGridItem, { backgroundColor: colors.bg }]}>
              <Ionicons name="business-outline" size={18} color={colors.teal} />
              <Text style={[styles.summaryGridLabel, { color: colors.textMuted }]}>UNIT KERJA</Text>
              <Text style={[styles.summaryGridValue, { color: colors.textMain }]} numberOfLines={1}>{orgUnitName || '-'}</Text>
            </View>

            <View style={[styles.summaryGridItem, { backgroundColor: colors.bg }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.teal} />
              <Text style={[styles.summaryGridLabel, { color: colors.textMuted }]}>STATUS</Text>
              <Text style={[styles.summaryGridValue, { color: '#10B981' }]} numberOfLines={1}>
                {employmentStatusName || 'Aktif'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Actions & Logout */}
        <TouchableOpacity
          style={[
            styles.logoutCardBtn,
            {
              backgroundColor: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
              borderColor: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
            }
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="power" size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Keluar dari Sesi Log-In</Text>
        </TouchableOpacity>

        {/* Bottom Tab Spacer */}
        <View style={{ height: 120 }} />
      </CustomRefreshScrollView>

      {/* Slide-Up Bottom Sheet Drawer Modal */}
      <Modal
        visible={showDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDrawer(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowDrawer(false)}
          />

          <View style={[styles.drawerContainer, { backgroundColor: colors.card }]}>
            {/* Drag Handle Top Bar */}
            <View style={styles.drawerHeader}>
              <View style={[styles.dragHandlePill, { backgroundColor: colors.border }]} />
              <View style={styles.drawerTitleRow}>
                <View style={styles.drawerTitleLeft}>
                  <Text style={[styles.drawerTitleText, { color: colors.textMain }]}>
                    Detail Informasi Pegawai
                  </Text>
                  <Text style={[styles.drawerSubTitleText, { color: colors.textMuted }]}>
                    {fullName} • NIP: {nip}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowDrawer(false)}
                  style={styles.closeDrawerBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={26} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Drawer Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.drawerScrollBody}
            >
              {/* Section 1: Informasi Kepegawaian */}
              <SectionHeader icon="briefcase-outline" title="Informasi Kepegawaian" colors={colors} />
              <View style={[styles.sectionCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <DetailRow label="ID / NIP Pegawai" value={nip} icon="barcode-outline" colors={colors} />
                <DetailRow label="Jabatan Resmi" value={position} icon="ribbon-outline" colors={colors} />
                <DetailRow label="Kategori Pekerjaan" value={jobCategoryName || '-'} icon="options-outline" colors={colors} />
                <DetailRow label="Unit Organisasi" value={orgUnitName || '-'} icon="business-outline" colors={colors} />
                <DetailRow label="Status Kepegawaian" value={employmentStatusName || '-'} icon="shield-checkmark-outline" colors={colors} />
                <DetailRow
                  label="Tanggal Masuk Kerja"
                  value={employee?.join_date ? employee.join_date.substring(0, 10) : '-'}
                  icon="calendar-outline"
                  colors={colors}
                  isLast
                />
              </View>

              {/* Section 2: Informasi Pribadi & Kontak */}
              <SectionHeader icon="person-outline" title="Informasi Pribadi & Kontak" colors={colors} />
              <View style={[styles.sectionCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <DetailRow label="NIK (KTP)" value={employee?.nik || '-'} icon="id-card-outline" colors={colors} />
                <DetailRow
                  label="Jenis Kelamin"
                  value={employee?.gender === 'M' ? 'Laki-laki' : employee?.gender === 'F' ? 'Perempuan' : '-'}
                  icon="male-female-outline"
                  colors={colors}
                />
                <DetailRow
                  label="Tempat, Tanggal Lahir"
                  value={`${employee?.place_of_birth || '-'}, ${employee?.date_of_birth ? employee.date_of_birth.substring(0, 10) : '-'}`}
                  icon="gift-outline"
                  colors={colors}
                />
                <DetailRow label="Agama" value={employee?.religion || '-'} icon="heart-outline" colors={colors} />
                <DetailRow label="Status Perkawinan" value={employee?.marital_status || '-'} icon="people-outline" colors={colors} />
                <DetailRow label="Golongan Darah" value={employee?.blood_type || '-'} icon="water-outline" colors={colors} />
                <DetailRow label="Nomor Telepon" value={employee?.phone || '-'} icon="call-outline" colors={colors} />
                <DetailRow label="Alamat Email" value={employee?.email || userInfo?.email || '-'} icon="mail-outline" colors={colors} />
                <DetailRow label="Alamat Tinggal" value={employee?.address || '-'} icon="location-outline" colors={colors} isLast />
              </View>

              {/* Section 3: Keuangan & BPJS */}
              <SectionHeader icon="wallet-outline" title="Keuangan & Jaminan Sosial" colors={colors} />
              <View style={[styles.sectionCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <DetailRow label="Bank Pembayaran Gaji" value={employee?.bank_name || '-'} icon="cash-outline" colors={colors} />
                <DetailRow label="Nomor Rekening" value={employee?.bank_account_number || '-'} icon="card-outline" colors={colors} />
                <DetailRow label="Atas Nama Rekening" value={employee?.bank_account_name || '-'} icon="person-circle-outline" colors={colors} />
                <DetailRow label="Nomor NPWP" value={employee?.npwp_number || '-'} icon="document-text-outline" colors={colors} />
                <DetailRow label="BPJS Kesehatan" value={employee?.bpjs_kesehatan_number || '-'} icon="medkit-outline" colors={colors} />
                <DetailRow label="BPJS Ketenagakerjaan" value={employee?.bpjs_ketenagakerjaan_number || '-'} icon="briefcase-outline" colors={colors} isLast />
              </View>

              {/* Dismiss Button inside Drawer */}
              <TouchableOpacity
                style={[styles.closeDrawerActionBtn, { backgroundColor: colors.teal }]}
                onPress={() => setShowDrawer(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeDrawerActionText}>Tutup Detail Pegawai</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; colors: any }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionHeaderIconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name={icon} size={15} color={colors.teal} />
      </View>
      <Text style={[styles.sectionHeaderTitleText, { color: colors.textMain }]}>{title}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  icon,
  colors,
  isLast = false,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: any;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
        <Ionicons name={icon} size={17} color={colors.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.textMain }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadgeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusHeadText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* ATM Card Styling */
  atmCardContainer: {
    borderRadius: 22,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#0A7973',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  atmCardGradient: {
    padding: 20,
    borderRadius: 22,
    position: 'relative',
  },
  cardShinePattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardBrandWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBrandText: {
    color: '#5EEAD4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contactlessWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passTag: {
    color: '#99F6E4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emvChipBox: {
    width: 44,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FBBF24',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  chipLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  hologramBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  embossedNipText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHolderLabel: {
    color: '#99F6E4',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardRoleText: {
    color: '#CCFBF1',
    fontSize: 11,
    fontWeight: '600',
  },
  cardOrgText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  cardAvatarFrame: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#5EEAD4',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  cardAvatarImage: {
    width: '100%',
    height: '100%',
  },
  tapHintStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    gap: 6,
  },
  tapHintText: {
    color: '#99F6E4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Open Drawer Trigger Card */
  openDrawerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  triggerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  triggerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  /* Summary Card */
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryGridItem: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
  },
  summaryGridLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 2,
  },
  summaryGridValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* Bottom Sheet Drawer Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  drawerContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.84,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  drawerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dragHandlePill: {
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: 12,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  drawerTitleLeft: {
    flex: 1,
  },
  drawerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  drawerSubTitleText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeDrawerBtn: {
    padding: 4,
  },
  drawerScrollBody: {
    paddingBottom: 20,
  },

  /* Section Styling inside Drawer */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitleText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeDrawerActionBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  closeDrawerActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  logoutCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
});

