import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useThemeContext } from '../../context/ThemeContext';
import CustomAlert from '../../components/CustomAlert';
import { getApiUrl } from '../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ActionScreen() {
  const params = useLocalSearchParams<{ mode?: string; earlyNotes?: string }>();
  const [activeMode, setActiveMode] = useState<'attendance' | 'qr'>('attendance');
  const [scannedQR, setScannedQR] = useState<boolean>(false);
  const activeModeRef = useRef<'attendance' | 'qr'>('attendance');

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    if (params.mode === 'qr') {
      setActiveMode('qr');
      setScannedQR(false);
    } else if (params.mode === 'attendance' || params.mode === 'face' || params.earlyNotes) {
      setActiveMode('attendance');
      setScannedQR(false);
    }
  }, [params.mode, params.earlyNotes]);
  const { colors } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses Presensi & Verifikasi Wajah...');
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Custom Styled Alert Toast State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onCloseCallback?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const isProcessingRef = useRef(false);

  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    onCloseCallback?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onCloseCallback,
    });
  };

  // Geo Location State
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('Mendeteksi lokasi GPS...');
  const [isFakeGPS, setIsFakeGPS] = useState<boolean>(false);
  const isFakeGPSRef = useRef<boolean>(false);
  const [locLoading, setLocLoading] = useState<boolean>(true);

  // Smart Attendance Action State
  const [smartAction, setSmartAction] = useState<'check-in' | 'check-out' | 'completed'>('check-in');
  const [employeeId, setEmployeeId] = useState<number>(0);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [hasRegisteredFace, setHasRegisteredFace] = useState<boolean>(true);

  // Camera & Face Capture State
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Animated scanner laser line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scanLineAnim.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 280,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // 1. Live Real-Time High Precision GPS Fetcher & Watcher
  const updateLocationState = async (loc: Location.LocationObject) => {
    setLocation(loc);

    // Detect Fake GPS / Mock Location
    const mocked = !!(loc as any).mocked || !!(loc as any).isMocked || !!(loc.coords as any).mocked || !!(loc.coords as any).isMocked;
    isFakeGPSRef.current = mocked;
    setIsFakeGPS(mocked);
    DeviceEventEmitter.emit('SET_FAKE_GPS_STATUS', { isFakeGPS: mocked });

    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const shortAddr = [item.street, item.district || item.city]
          .filter(Boolean)
          .join(', ');
        setAddress(shortAddr || `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      } else {
        setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      }
    } catch (e) {
      setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
    }
  };

  const fetchLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Izin GPS Ditolak');
        setLocLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      await updateLocationState(loc);
    } catch (err: any) {
      setAddress('Gagal Lokasi GPS');
    } finally {
      setLocLoading(false);
    }
  };

  useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;

    const startWatchingLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          fetchLocation();
          watcher = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 2500,
              distanceInterval: 1,
            },
            (newLoc) => {
              updateLocationState(newLoc);
            }
          );
        }
      } catch (e) { }
    };

    startWatchingLocation();

    return () => {
      if (watcher) {
        watcher.remove();
      }
    };
  }, []);

  // 2. Fetch User & Attendance & Face Reg Status
  const fetchAttendanceStatus = async () => {
    setCheckingStatus(true);
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

      const meRes = await fetch(getApiUrl('/api/auth/me'), { headers });
      if (!meRes.ok) return;
      const meJson = await meRes.json();
      const userId = meJson.user?.id;
      setEmployeeName(meJson.user?.name || 'Pegawai');

      const empRes = await fetch(getApiUrl(`/api/employees/by-user/${userId}`), { headers });
      if (!empRes.ok) return;
      const empJson = await empRes.json();
      const empData = empJson.data || empJson;
      const empId = empData.id;
      setEmployeeId(empId);

      // Check registered face photo status
      setHasRegisteredFace(!!(empData.photo && empData.photo !== ''));

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const attRes = await fetch(getApiUrl('/api/attendances?perPage=100'), { headers });
      if (attRes.ok) {
        const attJson = await attRes.json();
        const list = attJson.data || [];
        const todayAtt = list.find((item: any) => {
          const isSameEmp = item.employee_id == empId || item.employee_id == userId;
          const itemDate = item.date ? String(item.date).split('T')[0] : '';
          return isSameEmp && itemDate === todayStr;
        });

        if (!todayAtt) {
          setSmartAction('check-in');
        } else if (todayAtt.clock_in && !todayAtt.clock_out) {
          setSmartAction('check-out');
        } else if (todayAtt.clock_in && todayAtt.clock_out) {
          setSmartAction('completed');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingStatus(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAttendanceStatus();
      fetchLocation();
      DeviceEventEmitter.emit('SET_FAKE_GPS_STATUS', { isFakeGPS: isFakeGPSRef.current });
      return () => {
        DeviceEventEmitter.emit('SET_FAKE_GPS_STATUS', { isFakeGPS: false });
      };
    }, [])
  );

  const handleTakePhotoRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleTakePhotoRef.current = handleTakePhoto;
  });

  // 3. Register Face function (First-time Face Setup)
  const handleRegisterFace = async (photoUri: string, base64Str?: string): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return false;

      const photoPayload = base64Str ? `data:image/jpeg;base64,${base64Str}` : photoUri;

      const res = await fetch(getApiUrl(`/api/employees/${employeeId || 0}/register-face`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: photoPayload }),
      });

      const resJson = await res.json();
      if (res.ok) {
        setHasRegisteredFace(true);
        return true;
      } else {
        showAlert('error', 'Gagal Daftar Wajah', resJson.error || 'Gagal mendaftarkan foto wajah.');
        return false;
      }
    } catch (e: any) {
      showAlert('error', 'Error Server', e.message || 'Terjadi kesalahan koneksi.');
      return false;
    }
  };

  // 4. Instant Submit Attendance (NO PREVIEW)
  const handleTakePhoto = async () => {
    if (isProcessingRef.current) return;

    if (isFakeGPSRef.current || isFakeGPS) {
      showAlert(
        'warning',
        '⚠️ Fake GPS Terdeteksi',
        'Sistem mendeteksi aplikasi Lokasi Palsu (Mock Location). Harap matikan Fake GPS untuk melakukan presensi.'
      );
      return;
    }

    if (locLoading && !location) {
      showAlert('info', 'Mendeteksi Lokasi GPS', 'Sedang mengambil sinyal GPS akurat, mohon tunggu sebentar...');
      return;
    }

    if (smartAction === 'completed') {
      showAlert('info', 'Presensi Selesai', 'Anda sudah melakukan Presensi Masuk dan Pulang hari ini.');
      return;
    }

    if (!cameraRef.current) return;

    isProcessingRef.current = true;
    setLoadingText(!hasRegisteredFace ? 'Mendaftarkan Foto Wajah...' : 'Memproses Presensi & Verifikasi Wajah AI...');
    setLoading(true);

    try {
      // Get fresh live GPS position and mock check right at instant of photo capture
      let freshLat = location?.coords.latitude || -6.200000;
      let freshLon = location?.coords.longitude || 106.816666;
      let isMockedNow: boolean = false;

      try {
        const currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        if (currentLoc) {
          const mocked = !!(currentLoc as any).mocked || !!(currentLoc as any).isMocked || !!(currentLoc.coords as any).mocked || !!(currentLoc.coords as any).isMocked;
          if (mocked) {
            isMockedNow = true;
            isFakeGPSRef.current = true;
            setIsFakeGPS(true);
            DeviceEventEmitter.emit('SET_FAKE_GPS_STATUS', { isFakeGPS: true });
          }
          freshLat = currentLoc.coords.latitude;
          freshLon = currentLoc.coords.longitude;
          setLocation(currentLoc);
        }
      } catch (e) {
        if (!location) {
          setLoading(false);
          isProcessingRef.current = false;
          showAlert('error', 'Gagal Lokasi GPS', 'Tidak dapat menentukan lokasi GPS. Pastikan GPS aktif.');
          return;
        }
      }

      if (isMockedNow || isFakeGPSRef.current) {
        setLoading(false);
        isProcessingRef.current = false;
        showAlert(
          'warning',
          '⚠️ Fake GPS Terdeteksi',
          'Sistem mendeteksi aplikasi Lokasi Palsu (Mock Location). Harap matikan Fake GPS untuk melakukan presensi.'
        );
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (!photo || !photo.uri) {
        setLoading(false);
        isProcessingRef.current = false;
        showAlert('error', 'Error Kamera', 'Gagal mengambil gambar dari kamera.');
        return;
      }

      // If user hasn't registered face yet, register face first seamlessly!
      if (!hasRegisteredFace) {
        setLoadingText('Mendaftarkan Foto Wajah Pertama Kali...');
        const isRegistered = await handleRegisterFace(photo.uri, photo.base64);
        if (!isRegistered) {
          setLoading(false);
          isProcessingRef.current = false;
          return;
        }
        setLoadingText('Memproses Presensi & Verifikasi Wajah AI...');
      }

      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setLoading(false);
        isProcessingRef.current = false;
        return;
      }

      const endpoint = smartAction === 'check-in' ? '/api/attendances/check-in' : '/api/attendances/check-out';
      const photoPayload = photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo.uri;

      const payload: any = {
        employee_id: employeeId,
        latitude: freshLat,
        longitude: freshLon,
        photo: photoPayload,
        is_mocked: isMockedNow || isFakeGPSRef.current || isFakeGPS,
      };

      if (params.earlyNotes) {
        payload.notes = `[Pulang Cepat - Menunggu ACC HR] ${params.earlyNotes}`;
        payload.status = 'early_leave';
      }

      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();

      if (res.ok) {
        const isEarly = !!params.earlyNotes;
        showAlert(
          'success',
          isEarly ? '⚡ Pulang Cepat Tercatat!' : '🎉 Presensi Berhasil!',
          smartAction === 'check-in'
            ? `Presensi Masuk berhasil dicatat & verifikasi wajah cocok untuk ${employeeName}!`
            : (isEarly 
                ? `Presensi Pulang Cepat berhasil dicatat & menunggu ACC / Verifikasi dari pihak HR!`
                : `Presensi Pulang berhasil dicatat!`),
          () => router.push('/(tabs)/home')
        );
      } else {
        showAlert(
          'error',
          'Gagal Presensi',
          resJson.error || resJson.message || 'Gagal melakukan presensi.'
        );
      }
    } catch (e: any) {
      showAlert('error', 'Error Server', e.message || 'Gagal terhubung ke backend server.');
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
      fetchAttendanceStatus();
    }
  };

  // Barcode / QR Code Scanner Handler for Meeting Check-in
  const handleBarcodeScanned = async (result: { data: string; type: string }) => {
    if (scannedQR || isProcessingRef.current) return;
    const rawData = result.data?.trim();
    if (!rawData) return;

    setScannedQR(true);
    isProcessingRef.current = true;
    setLoading(true);
    setLoadingText('Mendeteksi QR Code Rapat...');

    try {
      // 1. Extract token from URL (e.g. ?token=UUID) or raw string
      let token = rawData;
      if (rawData.includes('token=')) {
        const match = rawData.match(/token=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          token = match[1];
        }
      }

      const authToken = await SecureStore.getItemAsync('userToken');
      if (!authToken) {
        showAlert('error', 'Sesi Habis', 'Silakan login kembali.', () => router.replace('/(auth)/login'));
        return;
      }

      // 2. Resolve User ID
      let userId = employeeId;
      try {
        const meRes = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (meRes.ok) {
          const meJson = await meRes.json();
          if (meJson.user?.id) {
            userId = meJson.user.id;
          }
        }
      } catch (e) { }

      setLoadingText('Memproses Presensi Rapat...');

      // 3. Post to /api/meetings/check-in-by-token
      const res = await fetch(getApiUrl(`/api/meetings/check-in-by-token?token=${encodeURIComponent(token)}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          token: token,
        }),
      });

      const resJson = await res.json();
      if (res.ok) {
        if (resJson.meeting_id) {
          try {
            const raw = await SecureStore.getItemAsync('checked_in_meetings');
            const arr = raw ? JSON.parse(raw) : [];
            if (!arr.includes(resJson.meeting_id)) {
              arr.push(resJson.meeting_id);
              await SecureStore.setItemAsync('checked_in_meetings', JSON.stringify(arr));
            }
          } catch (e) {}
        }

        showAlert(
          'success',
          'Presensi Rapat Berhasil! 🎉',
          `Kehadiran Anda pada rapat "${resJson.meeting_title || 'Agenda Rapat'}" telah berhasil dicatat.`,
          () => {
            setScannedQR(false);
            router.push('/(tabs)/document');
          }
        );
      } else {
        showAlert(
          'error',
          'Presensi Gagal',
          resJson.error || 'Token QR Code tidak valid atau rapat belum dimulai.',
          () => {
            setScannedQR(false);
          }
        );
      }
    } catch (e: any) {
      showAlert('error', 'Error Koneksi', e.message || 'Gagal menghubungi server.', () => {
        setScannedQR(false);
      });
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    fetchAttendanceStatus();

    // Listen for bottom tab bar "Ambil Gambar" button press event
    const photoSub = DeviceEventEmitter.addListener('ACTION_TAKE_PHOTO', () => {
      if (activeModeRef.current === 'qr') {
        showAlert('info', 'Mode Scan QR Aktif', 'Arahkan kamera ke QR Code rapat di layar proyektor / web. Scanner akan membaca QR secara otomatis.');
      } else {
        if (isFakeGPSRef.current) {
          showAlert(
            'warning',
            '⚠️ Fake GPS Terdeteksi',
            'Sistem mendeteksi aplikasi Lokasi Palsu (Mock Location). Harap matikan Fake GPS untuk melakukan presensi.'
          );
          return;
        }
        handleTakePhotoRef.current();
      }
    });

    const alertSub = DeviceEventEmitter.addListener('SHOW_FAKE_GPS_ALERT', () => {
      showAlert(
        'warning',
        '⚠️ Fake GPS Terdeteksi',
        'Sistem mendeteksi aplikasi Lokasi Palsu (Mock Location). Harap matikan Fake GPS untuk melakukan presensi.'
      );
    });

    return () => {
      photoSub.remove();
      alertSub.remove();
    };
  }, []);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={60} color="#64748B" />
        <Text style={styles.permissionText}>Akses kamera diperlukan untuk verifikasi presensi wajah pegawai.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Izinkan Akses Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      {/* CUSTOM STYLED TOP ALERT TOAST COMPONENT */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.onCloseCallback) {
            alertConfig.onCloseCallback();
          }
        }}
      />

      {/* 1. ISOLATED CAMERA BACKGROUND */}
      <View style={styles.fullScreenAbsolute}>
        <CameraView
          ref={cameraRef}
          style={styles.fullScreenAbsolute}
          facing={activeMode === 'qr' ? 'back' : 'front'}
          barcodeScannerSettings={activeMode === 'qr' ? { barcodeTypes: ['qr'] } : undefined}
          onBarcodeScanned={activeMode === 'qr' && !scannedQR ? handleBarcodeScanned : undefined}
        />
      </View>

      {/* 2. OVERLAY LAYER */}
      <View style={styles.fullScreenAbsolute} pointerEvents="box-none">
        {/* ABSOLUTE CENTERED SCANNER FRAME */}
        <View style={styles.cameraFrameOverlay} pointerEvents="none">
          {activeMode === 'attendance' ? (
            <View style={[styles.faceOvalFrame, { borderColor: isFakeGPS ? '#EF4444' : hasRegisteredFace ? '#10B981' : '#F59E0B' }]}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateY: scanLineAnim }],
                    backgroundColor: isFakeGPS ? '#EF4444' : hasRegisteredFace ? '#10B981' : '#F59E0B',
                  },
                ]}
              />
            </View>
          ) : (
            <View style={styles.qrScannerFrame}>
              {/* Corner Brackets */}
              <View style={[styles.qrCorner, styles.qrCornerTL]} />
              <View style={[styles.qrCorner, styles.qrCornerTR]} />
              <View style={[styles.qrCorner, styles.qrCornerBL]} />
              <View style={[styles.qrCorner, styles.qrCornerBR]} />
              <Animated.View
                style={[
                  styles.qrScanLine,
                  {
                    transform: [{ translateY: scanLineAnim }],
                    backgroundColor: '#14B8A6',
                  },
                ]}
              />
            </View>
          )}

          {activeMode === 'qr' && (
            <View style={styles.qrInstructionBox}>
              <Text style={styles.qrInstructionTitle}>Scan QR Code Rapat</Text>
              <Text style={styles.qrInstructionSubtitle}>
                Arahkan kamera ke QR Code rapat yang ditampilkan di layar proyektor / web.
              </Text>
            </View>
          )}
        </View>

        {/* TOP SAFE AREA HEADER */}
        <SafeAreaView style={styles.topOverlayContainer} edges={['top']} pointerEvents="box-none">
          {/* Mode Switcher Pill */}
          <View style={styles.modeSwitcherContainer}>
            <TouchableOpacity
              style={[styles.modeButton, activeMode === 'attendance' && styles.modeButtonActive]}
              onPress={() => {
                setActiveMode('attendance');
                setScannedQR(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-circle-outline"
                size={16}
                color={activeMode === 'attendance' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text style={[styles.modeButtonText, activeMode === 'attendance' && styles.modeButtonTextActive]}>
                Presensi Kehadiran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, activeMode === 'qr' && styles.modeButtonActive]}
              onPress={() => {
                setActiveMode('qr');
                setScannedQR(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="qr-code-outline"
                size={15}
                color={activeMode === 'qr' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text style={[styles.modeButtonText, activeMode === 'qr' && styles.modeButtonTextActive]}>
                Scan QR Rapat
              </Text>
            </TouchableOpacity>
          </View>

          {activeMode === 'attendance' ? (
            <>
            <View style={styles.headerRow}>
              {/* Location Pill */}
              <View style={[styles.compactLocationPill, isFakeGPS && styles.fakeGpsPill]}>
                <Ionicons
                  name={isFakeGPS ? "alert-circle" : "location-sharp"}
                  size={13}
                  color={isFakeGPS ? "#EF4444" : "#14B8A6"}
                />
                <Text style={[styles.compactLocationText, isFakeGPS && { color: '#EF4444' }]} numberOfLines={1}>
                  {isFakeGPS ? '⚠️ FAKE GPS' : address}
                </Text>
                {locLoading && <ActivityIndicator size="small" color="#14B8A6" style={{ marginLeft: 3 }} />}
                <TouchableOpacity onPress={fetchLocation} style={{ marginLeft: 4 }}>
                  <Ionicons name="refresh-outline" size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Smart Status Chip */}
              <View style={styles.smartActionChip}>
                {checkingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: smartAction === 'check-in' ? '#10B981' : smartAction === 'check-out' ? '#F59E0B' : '#64748B' }
                    ]} />
                    <Text style={styles.smartActionText}>
                      {smartAction === 'check-in' ? 'PRESENSI MASUK' : smartAction === 'check-out' ? 'PRESENSI PULANG' : 'SELESAI'}
                    </Text>
                  </>
                )}
              </View>
            </View>
            {isFakeGPS ? (
              <View style={styles.fakeGpsAlertBanner}>
                <View style={styles.fakeGpsAlertIconBg}>
                  <Ionicons name="warning" size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fakeGpsAlertTitle}>⚠️ Fake GPS Terdeteksi!</Text>
                  <Text style={styles.fakeGpsAlertText}>
                    Tombol presensi dikunci. Matikan lokasi palsu & tekan Cek Ulang.
                  </Text>
                </View>
                <TouchableOpacity style={styles.fakeGpsRefreshButton} onPress={fetchLocation} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={13} color="#FFFFFF" />
                  <Text style={styles.fakeGpsRefreshButtonText}>Cek Ulang</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {params.earlyNotes ? (
              <View style={{ backgroundColor: '#EA580C', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'center', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 }}>
                <Ionicons name="time" size={15} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Presensi Pulang Cepat (Menunggu ACC HR)</Text>
              </View>
            ) : null}
            </>
          ) : (
            <View style={styles.headerRow}>
              <View style={styles.qrActivePill}>
                <View style={styles.activeDot} />
                <Text style={styles.qrActivePillText}>Kamera Belakang • Scanner Aktif</Text>
              </View>
              {scannedQR && (
                <TouchableOpacity
                  style={styles.rescanBtn}
                  onPress={() => setScannedQR(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={14} color="#FFF" />
                  <Text style={styles.rescanBtnText}>Scan Ulang</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* First-time Face Registration Banner (only in attendance mode) */}
          {activeMode === 'attendance' && !hasRegisteredFace && (
            <View style={styles.registerFaceBanner}>
              <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
              <Text style={styles.registerFaceBannerText}>
                Silakan Daftarkan Foto Wajah Anda (Tekan "Ambil Gambar" di bawah)
              </Text>
            </View>
          )}
        </SafeAreaView>

        {/* FULL SCREEN LOADING OVERLAY (DURING INSTANT PRESENSI / VERIFICATION) */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#14B8A6" />
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  topOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    zIndex: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  compactLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: SCREEN_WIDTH * 0.52,
  },
  fakeGpsPill: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  compactLocationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  smartActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  smartActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  registerFaceBanner: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registerFaceBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cameraFrameOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#0A7973',
  },
  modeButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  qrScannerFrame: {
    width: 240,
    height: 240,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  qrCorner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#14B8A6',
  },
  qrCornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  qrCornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  qrCornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  qrCornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  qrScanLine: {
    width: '100%',
    height: 3,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  qrInstructionBox: {
    marginTop: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  qrInstructionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  qrInstructionSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  qrActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  qrActivePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A7973',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  rescanBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  faceOvalFrame: {
    width: 250,
    height: 330,
    borderRadius: 125,
    borderWidth: 2.5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scanLine: {
    width: '100%',
    height: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  loadingBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomOverlayContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenShutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#14B8A6',
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledShutterBtn: {
    borderColor: '#64748B',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    opacity: 0.5,
  },
  innerShutterCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#14B8A6',
  },
  fakeGpsAlertBanner: {
    marginTop: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#F87171',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fakeGpsAlertIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeGpsAlertTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  fakeGpsAlertText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  fakeGpsRefreshButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  fakeGpsRefreshButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
