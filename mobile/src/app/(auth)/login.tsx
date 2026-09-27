import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput, Button } from 'react-native-paper';
import CustomAlert from '../../components/CustomAlert';
import * as SecureStore from 'expo-secure-store';
import { getApiUrl } from '../../config/api';

export default function LoginScreen() {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  const isDark = useColorScheme() === 'dark';

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const theme = {
    bg: isDark ? '#0F172A' : '#F0F9FF',
    text: isDark ? '#FFFFFF' : '#1E293B',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    primary: '#0EA5E9',
    primaryDark: '#0284C7',
    inputBg: isDark ? '#1E293B' : '#FFFFFF',
  };

  const handleLogin = async () => {
    if (!nip || !password) {
      showAlert('warning', 'Data Tidak Lengkap', 'NIP dan Kata Sandi wajib diisi untuk masuk ke sistem.');
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      setLoading(false);

      if (response.ok && data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
        router.replace('/(tabs)/home');
      } else {
        showAlert('error', 'Gagal Masuk', data.error || 'NIP atau password salah.');
      }
    } catch (error: any) {
      setLoading(false);
      if (error.name === 'AbortError') {
        showAlert('error', 'Koneksi Terputus', 'Server tidak merespon, pastikan backend berjalan.');
      } else {
        showAlert('error', 'Gagal Masuk', 'Terjadi kesalahan sistem, periksa kembali koneksi Anda.');
      }
    }
  };

  const content = (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.logoWrapper, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
            transition={500}
          />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          Sistem Informasi Kepegawaian
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          mode="flat"
          label="Nomor Induk Pegawai"
          value={nip}
          onChangeText={setNip}
          keyboardType="numeric"
          autoCapitalize="none"
          returnKeyType="next"
          left={<TextInput.Icon icon="account" />}
          style={[styles.input, { backgroundColor: 'transparent' }]}
          outlineColor="transparent"
          activeUnderlineColor={theme.primary}
          textColor={theme.text}
          disabled={loading}
        />

        <TextInput
          mode="flat"
          label="Kata Sandi"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          left={<TextInput.Icon icon="lock" />}
          right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
          style={[styles.input, { backgroundColor: 'transparent' }]}
          outlineColor="transparent"
          activeUnderlineColor={theme.primary}
          textColor={theme.text}
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          buttonColor={theme.primary}
        >
          MASUK KE SISTEM
        </Button>
      </View>

    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#E0F2FE', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
      
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  formContainer: {
    paddingHorizontal: 8,
  },
  input: {
    marginBottom: 24,
    fontSize: 16,
  },
  button: {
    marginTop: 12,
    borderRadius: 16,
    elevation: 4,
  },
  buttonContent: {
    height: 60,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  }
});
