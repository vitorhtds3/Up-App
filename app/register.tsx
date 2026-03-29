import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome obrigatório';
    if (!email.trim()) e.email = 'Email obrigatório';
    else if (!email.includes('@')) e.email = 'Email inválido';
    if (!password) e.password = 'Senha obrigatória';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) e.confirmPassword = 'Senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Erro ao criar conta', error);
    } else {
      Alert.alert(
        'Conta criada!',
        'Verifique seu email para confirmar o cadastro.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    }
  };

  const Field = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    secure = false,
    keyboardType = 'default' as any,
    errorKey,
  }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, errors[errorKey] ? styles.inputError : null]}>
        <MaterialIcons name={icon} size={18} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            setErrors((e) => ({ ...e, [errorKey]: undefined }));
          }}
          secureTextEntry={secure && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
        />
        {errorKey === 'password' || errorKey === 'confirmPassword' ? (
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.textLight}
            />
          </Pressable>
        ) : null}
      </View>
      {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.primary }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/login')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>UP.</Text>
          </View>
          <Text style={styles.appName}>Criar conta</Text>
          <Text style={styles.tagline}>Rápido, simples e gratuito</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cadastre-se</Text>
          <Text style={styles.cardSubtitle}>Crie sua conta para começar a pedir</Text>
          <Field label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" icon="person" errorKey="name" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" icon="email" keyboardType="email-address" errorKey="email" />
          <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" icon="lock" secure errorKey="password" />
          <Field label="Confirmar senha" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a senha" icon="lock-outline" secure errorKey="confirmPassword" />

          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>CRIAR CONTA</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    paddingBottom: 28,
    gap: 6,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 20,
    padding: 8,
  },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.82)' },
  card: {
    backgroundColor: '#FAFAF8',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flex: 1,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#888888', marginBottom: 20 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#444444', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    height: 50,
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: FontSize.base, color: '#1A1A1A', includeFontPadding: false },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 3 },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    ...Shadow.md,
  },
  registerBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.2 },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginHint: { fontSize: FontSize.base, color: '#888888' },
  loginLink: { fontSize: FontSize.base, color: Colors.primary, fontWeight: '700' },
});
