import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Text,
  Modal,
  TextInput,
  Animated,
  Easing,
  useWindowDimensions,
  Image,
  Platform,
} from 'react-native';

import Dashboard from './components/Dashboard';
import UsageSection from './components/UsageSection';
import PaymentSection from './components/PaymentSection';
import CompanyInfo from './components/CompanyInfo';
import MaintenanceSection from './components/MaintenanceSection';
import Navbar from './components/Navbar';
import { useFonts } from 'expo-font';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import { showClientAlert } from './utils/showClientAlert';

// Import background image for web
const backgroundImageUri = require('./assets/electripay-bg.jpg');
const backgroundImageLightUri = require('./assets/electripay-bckgrd.png');

const IS_WEB = Platform.OS === 'web';

const API_CONFIG = {
  // Tunnel URL - update this with your actual ngrok URL or use environment variable
  tunnel: process.env.EXPO_PUBLIC_NGROK_URL || 'https://your-ngrok-url.ngrok.io',
  // Local development URLs
  local: 'http://localhost:5000',
  machineIP: 'http://10.0.78.46:5000',  // For phones on same network
  localAndroid: 'http://10.0.2.2:5000',
};

// API_CANDIDATES prioritized by environment and availability
const getApiCandidates = () => {
  const candidates = [
    // First try environment variable (most reliable for production)
    process.env.EXPO_PUBLIC_API_URL,
  ];

  // Prioritize based on platform
  if (IS_WEB) {
    // For web: try localhost first
    candidates.push(API_CONFIG.local);
    candidates.push(API_CONFIG.machineIP);
  } else {
    // For phones: try machine IP first
    candidates.push(API_CONFIG.machineIP);
    candidates.push(API_CONFIG.local);
  }

  // Add other options
  candidates.push(API_CONFIG.localAndroid);
  
  // Add ngrok tunnel if not placeholder
  if (API_CONFIG.tunnel && !API_CONFIG.tunnel.includes('your-ngrok-url')) {
    candidates.push(API_CONFIG.tunnel);
  }

  return candidates
    .map((url) => (typeof url === 'string' ? url.trim().replace(/\/+$/, '') : ''))
    .filter(Boolean)
    .filter((url, index, arr) => arr.indexOf(url) === index);
};

const API_CANDIDATES = getApiCandidates();

const NGROK_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
};

const THEMES = {
  dark: {
    mode: 'dark',
    background: '#081121',
    surface: '#111d33',
    surfaceAlt: '#182848',
    primary: '#182848',
    accent: '#fbbf24',
    darkBlue: '#1f3258',
    white: '#f8fafc',
    darkBg: '#f8fafc',
    text: '#f8fafc',
    mutedText: '#9fb0cd',
    border: 'rgba(148, 163, 184, 0.2)',
    overlay: 'rgba(2, 6, 23, 0.72)',
    success: '#16a34a',
    danger: '#ef4444',
    inputBg: '#0a1427',
    tabBarBg: '#0b162b',
    shadow: '#000000',
  },
  light: {
    mode: 'light',
    background: '#eef4ff',
    surface: '#ffffff',
    surfaceAlt: '#e3edff',
    primary: '#e3edff',
    accent: '#ea580c',
    darkBlue: '#2a5fbf',
    white: '#ffffff',
    darkBg: '#0f172a',
    text: '#0f172a',
    mutedText: '#475569',
    border: 'rgba(15, 23, 42, 0.12)',
    overlay: 'rgba(15, 23, 42, 0.38)',
    success: '#15803d',
    danger: '#dc2626',
    inputBg: '#f8fafc',
    tabBarBg: '#ffffff',
    shadow: '#1e293b',
  },
};

const emptySignupForm = {
  name: '',
  email: '',
  contact: '',
  address: '',
  username: '',
  password: '',
  confirmPassword: '',
};

const emptyForgotForm = {
  username: '',
  email: '',
  contact: '',
  newPassword: '',
  confirmNewPassword: '',
};

export default function App() {
  const [fontsLoaded] = useFonts({
    ElectroFont1: require('./assets/fonts/Electric-Formula.ttf'),
    ElectroFont2: require('./assets/fonts/Roboc.otf'),
  });
  const [activeTab, setActiveTab] = useState('company');
  const [showLoginModal, setShowLoginModal] = useState(!IS_WEB);
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [forgotForm, setForgotForm] = useState(emptyForgotForm);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [apiUrl, setApiUrl] = useState('');
  const [isResolvingApi, setIsResolvingApi] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');
  const [webMenuOpen, setWebMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(70)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const webMenuTranslateX = useRef(new Animated.Value(24)).current;
  const webMenuOpacity = useRef(new Animated.Value(0)).current;
  const webContentTranslateY = useRef(new Animated.Value(18)).current;
  const webContentOpacity = useRef(new Animated.Value(0)).current;
  const backgroundFadeAnim = useRef(new Animated.Value(themeMode === 'light' ? 1 : 0)).current;
  const pagerRef = useRef(null);
  const colors = THEMES[themeMode];
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = IS_WEB;
  const isLaptopWeb = isWeb && screenWidth >= 1024;

  const tabs = ['company', 'payment', 'dashboard', 'profile', 'maintenance'];
  const tabWidth = screenWidth / tabs.length;
  const pageWidth = isWeb ? Math.min(screenWidth, 1240) : screenWidth;
  const webHighlights = [
    { value: 'Live Bills', label: 'Track balances and due dates in real time' },
    { value: 'QR Payments', label: 'Pay in seconds and keep proof in one place' },
    { value: 'Usage Trends', label: 'Spot patterns before the next billing cycle' },
  ];
  const getContentGlassStyle = (variant = 'base') => {
    const darkMode = colors.mode === 'dark';
    const isStrong = variant === 'strong';
    const bg = darkMode
      ? isStrong
        ? 'rgba(15, 23, 42, 0.38)'
        : 'rgba(15, 23, 42, 0.26)'
      : isStrong
        ? 'rgba(255, 255, 255, 0.5)'
        : 'rgba(255, 255, 255, 0.34)';

    return {
      backgroundColor: bg,
      borderColor: darkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(255, 255, 255, 0.85)',
      ...(Platform.OS === 'web'
        ? {
            backdropFilter: 'blur(18px) saturate(145%)',
            WebkitBackdropFilter: 'blur(18px) saturate(145%)',
          }
        : {}),
    };
  };

  const resetAuthFields = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setSignupForm(emptySignupForm);
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
    setHasAcceptedTerms(false);
    setShowTermsModal(false);
    setForgotForm(emptyForgotForm);
    setShowForgotPassword(false);
    setShowForgotConfirmPassword(false);
  };

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const parseApiResponse = async (response) => {
    const rawText = await response.text();

    if (!rawText) {
      return {};
    }

    try {
      return JSON.parse(rawText);
    } catch (error) {
      if (rawText.startsWith('Tunnel') || rawText.includes('ngrok')) {
        throw new Error('The ngrok tunnel is inactive or showing a tunnel warning page. Start a fresh tunnel and update EXPO_PUBLIC_API_URL (or API_CONFIG.tunnel) in App.js.');
      }

      if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
        throw new Error('The server returned an HTML page instead of API JSON. Check the backend API base URL in App.js.');
      }

      throw new Error(`Unexpected server response: ${rawText.slice(0, 120)}`);
    }
  };

  const resolveApiUrl = async () => {
    setIsResolvingApi(true);

    for (const candidate of API_CANDIDATES) {
      try {
        console.log(`🔍 Trying API candidate: ${candidate}`);
        const healthResponse = await fetchWithTimeout(
          `${candidate}/health`,
          { headers: NGROK_HEADERS },
          4500
        );

        console.log(`✅ Got response from ${candidate}:`, healthResponse.status);

        if (!healthResponse.ok) {
          console.log(`❌ Response not OK for ${candidate}`);
          continue;
        }

        const parsed = await parseApiResponse(healthResponse);
        console.log(`📊 Parsed response:`, parsed);
        
        if (parsed?.ok) {
          console.log(`🎉 Found working API: ${candidate}`);
          setApiUrl(candidate);
          setIsResolvingApi(false);
          return candidate;
        }
      } catch (error) {
        console.error(`❌ Error trying ${candidate}:`, error.message);
        continue;
      }
    }

    console.error('❌ No API candidate worked');
    setApiUrl('');
    setIsResolvingApi(false);
    return '';
  };

  useEffect(() => {
    let isMounted = true;

    const probeApi = async () => {
      const resolvedUrl = await resolveApiUrl();
      if (!isMounted) {
        return;
      }

      if (resolvedUrl) {
        return;
      }
    };

    probeApi();
    const intervalId = setInterval(probeApi, 8000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (showLoginModal && !isLoggedIn) {
      modalTranslateY.setValue(70);
      modalOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(modalTranslateY, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showLoginModal, isLoggedIn, modalOpacity, modalTranslateY]);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    if (webMenuOpen) {
      webMenuTranslateX.setValue(24);
      webMenuOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(webMenuTranslateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(webMenuOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(webMenuTranslateX, {
        toValue: 24,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(webMenuOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isWeb, webMenuOpen, webMenuOpacity, webMenuTranslateX]);

  useEffect(() => {
    Animated.timing(backgroundFadeAnim, {
      toValue: themeMode === 'light' ? 1 : 0,
      duration: 200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [backgroundFadeAnim, themeMode]);

  useEffect(() => {
    if (!isWeb || !isLoggedIn) {
      return;
    }

    webContentTranslateY.setValue(activeTab === 'profile' ? 24 : 14);
    webContentOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(webContentTranslateY, {
        toValue: 0,
        duration: activeTab === 'profile' ? 340 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(webContentOpacity, {
        toValue: 1,
        duration: activeTab === 'profile' ? 300 : 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, isLoggedIn, isWeb, webContentOpacity, webContentTranslateY]);

  if (!fontsLoaded) {
    return null;
  }

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    resetAuthFields();
  };

  const handleLogin = async () => {
    const resolvedApiUrl = apiUrl || await resolveApiUrl();

    if (!resolvedApiUrl) {
      showClientAlert('Error', 'API server is not reachable yet. Start your backend server and ngrok, then reload the app.');
      return;
    }

    try {
      const res = await fetch(`${resolvedApiUrl}/login`, {
        method: 'POST',
        headers: { ...NGROK_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await parseApiResponse(res);

      if (res.ok) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setWebMenuOpen(false);
        if (isWeb) setActiveTab('dashboard');
        switchAuthMode('login');
        showClientAlert('Success', 'Login successful!');
      } else {
        showClientAlert('Error', 'Invalid username or password');
      }
    } catch (err) {
      showClientAlert('Error', err.message || 'Server not reachable');
      console.log(err);
    }
  };

  const handleSignup = async () => {
    const resolvedApiUrl = apiUrl || await resolveApiUrl();

    if (!resolvedApiUrl) {
      showClientAlert('Error', 'API server is not reachable yet. Start your backend server and ngrok, then reload the app.');
      return;
    }

    if (
      !signupForm.name ||
      !signupForm.email ||
      !signupForm.contact ||
      !signupForm.address ||
      !signupForm.username ||
      !signupForm.password
    ) {
      showClientAlert('Error', 'Please complete all sign up fields');
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      showClientAlert('Error', 'Password confirmation does not match');
      return;
    }

    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      showClientAlert('Terms Required', 'Please review and agree to the Terms & Conditions to continue.');
      return;
    }

    try {
      const res = await fetch(`${resolvedApiUrl}/signup`, {
        method: 'POST',
        headers: { ...NGROK_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupForm.name,
          email: signupForm.email,
          contact: signupForm.contact,
          address: signupForm.address,
          username: signupForm.username,
          password: signupForm.password,
        }),
      });

      const data = await parseApiResponse(res);

      if (res.ok) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setWebMenuOpen(false);
        if (isWeb) setActiveTab('dashboard');
        switchAuthMode('login');
        showClientAlert('Success', 'Account created successfully!');
      } else {
        showClientAlert('Error', data.message || 'Sign up failed');
      }
    } catch (err) {
      showClientAlert('Error', err.message || 'Failed to create account');
      console.log(err);
    }
  };

  const handleForgotPassword = async () => {
    const resolvedApiUrl = apiUrl || await resolveApiUrl();

    if (!resolvedApiUrl) {
      showClientAlert('Error', 'API server is not reachable yet. Start your backend server and ngrok, then reload the app.');
      return;
    }

    const normalizedForgotForm = {
      username: forgotForm.username.trim(),
      email: forgotForm.email.trim().toLowerCase(),
      contact: forgotForm.contact.replace(/\D/g, ''),
      newPassword: forgotForm.newPassword,
      confirmNewPassword: forgotForm.confirmNewPassword,
    };

    if (
      !normalizedForgotForm.username ||
      !normalizedForgotForm.email ||
      !normalizedForgotForm.contact ||
      !normalizedForgotForm.newPassword
    ) {
      showClientAlert('Error', 'Please complete all recovery fields');
      return;
    }

    if (normalizedForgotForm.newPassword !== normalizedForgotForm.confirmNewPassword) {
      showClientAlert('Error', 'New password confirmation does not match');
      return;
    }

    try {
      const res = await fetch(`${resolvedApiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { ...NGROK_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedForgotForm.username,
          email: normalizedForgotForm.email,
          contact: normalizedForgotForm.contact,
          newPassword: normalizedForgotForm.newPassword,
        }),
      });

      const data = await parseApiResponse(res);

      if (res.ok) {
        showClientAlert('Success', 'Password reset successful. You can now log in.');
        switchAuthMode('login');
      } else {
        showClientAlert('Error', data.message || 'Password reset failed');
      }
    } catch (err) {
      showClientAlert('Error', err.message || 'Failed to reset password');
      console.log(err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowLoginModal(!isWeb);
    setActiveTab('company');
    setWebMenuOpen(false);
    switchAuthMode('login');
  };
  const toggleTheme = () => {
    setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'));
  };
  const openAuthModal = (mode) => {
    switchAuthMode(mode);
    setShowLoginModal(true);
  };
  const renderThemeSwitch = () => (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.webThemeSwitch,
        {
          backgroundColor: themeMode === 'dark' ? colors.surfaceAlt : colors.accent,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.webThemeSwitchLabel, { color: colors.text }]}>
        {themeMode === 'dark' ? 'Dark' : 'Light'}
      </Text>
      <View
        style={[
          styles.webThemeSwitchTrack,
          { backgroundColor: themeMode === 'dark' ? '#0b162b' : '#fff7ed' },
        ]}
      >
        <View
          style={[
            styles.webThemeSwitchThumb,
            {
              backgroundColor: themeMode === 'dark' ? colors.accent : colors.darkBlue,
              transform: [{ translateX: themeMode === 'dark' ? 18 : 0 }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  const handleUserRefresh = (updatedUser) => {
    setCurrentUser((current) => ({
      ...current,
      ...updatedUser,
    }));
  };

  const handleTabPress = (tab) => {
    const index = tabs.indexOf(tab);

    Animated.spring(tabIndicatorAnim, {
      toValue: index,
      useNativeDriver: false,
    }).start();

    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
  };

  const handleSwipeEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    const nextTab = tabs[nextIndex] || 'company';

    Animated.spring(tabIndicatorAnim, {
      toValue: nextIndex,
      useNativeDriver: false,
    }).start();

    setActiveTab(nextTab);
  };

  const renderAuthContent = () => {
    const themedInputStyle = [
      styles.inputModern,
      { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
    ];
    const renderPasswordField = (fieldProps) => (
      <View
        style={[
          styles.passwordInputWrap,
          { backgroundColor: colors.inputBg, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.passwordInputField, { color: colors.text }]}
          placeholder={fieldProps.placeholder}
          placeholderTextColor={colors.mutedText}
          secureTextEntry={!fieldProps.visible}
          value={fieldProps.value}
          onChangeText={fieldProps.onChangeText}
          onSubmitEditing={fieldProps.onSubmitEditing}
          returnKeyType={fieldProps.returnKeyType || 'done'}
        />
        <TouchableOpacity onPress={fieldProps.onToggle} style={styles.passwordToggle}>
          <FontAwesome
            name={fieldProps.visible ? 'eye-slash' : 'eye'}
            size={18}
            color={colors.darkBlue}
          />
        </TouchableOpacity>
      </View>
    );

    if (authMode === 'signup') {
      return (
        <>
          <TextInput style={themedInputStyle} placeholder="Full Name" value={signupForm.name} onChangeText={(text) => setSignupForm({ ...signupForm, name: text })} placeholderTextColor={colors.mutedText} />
          <TextInput style={themedInputStyle} placeholder="Email" value={signupForm.email} onChangeText={(text) => setSignupForm({ ...signupForm, email: text })} placeholderTextColor={colors.mutedText} autoCapitalize="none" />
          <TextInput style={themedInputStyle} placeholder="Contact Number" value={signupForm.contact} onChangeText={(text) => setSignupForm({ ...signupForm, contact: text })} placeholderTextColor={colors.mutedText} keyboardType="phone-pad" />
          <TextInput style={themedInputStyle} placeholder="Address" value={signupForm.address} onChangeText={(text) => setSignupForm({ ...signupForm, address: text })} placeholderTextColor={colors.mutedText} />
          <TextInput style={themedInputStyle} placeholder="Username" value={signupForm.username} onChangeText={(text) => setSignupForm({ ...signupForm, username: text })} placeholderTextColor={colors.mutedText} autoCapitalize="none" />
          {renderPasswordField({
            placeholder: 'Password',
            value: signupForm.password,
            visible: showSignupPassword,
            onToggle: () => setShowSignupPassword((value) => !value),
            onChangeText: (text) => setSignupForm({ ...signupForm, password: text }),
          })}
          {renderPasswordField({
            placeholder: 'Confirm Password',
            value: signupForm.confirmPassword,
            visible: showSignupConfirmPassword,
            onToggle: () => setShowSignupConfirmPassword((value) => !value),
            onChangeText: (text) => setSignupForm({ ...signupForm, confirmPassword: text }),
          })}
          <TouchableOpacity
            style={[styles.termsButton, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            onPress={() => setShowTermsModal(true)}
          >
            <Text style={[styles.termsButtonText, { color: colors.darkBlue }]}>View Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.termsAgreeRow}
            onPress={() => setHasAcceptedTerms((prev) => !prev)}
          >
            <View
              style={[
                styles.termsCheckbox,
                {
                  borderColor: hasAcceptedTerms ? colors.accent : colors.border,
                  backgroundColor: hasAcceptedTerms ? colors.accent : 'transparent',
                },
              ]}
            >
              {hasAcceptedTerms ? (
                <FontAwesome
                  name="check"
                  size={12}
                  color={colors.mode === 'dark' ? '#0b1020' : '#ffffff'}
                />
              ) : null}
            </View>
            <Text style={[styles.termsAgreeText, { color: colors.text }]}>
              I agree to the Terms & Conditions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.accent }]} onPress={handleSignup}>
            <Text style={[styles.loginButtonText, { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' }]}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => switchAuthMode('login')}>
            <Text style={[styles.authLink, { color: colors.darkBlue }]}>Back to Login</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (authMode === 'forgot') {
      return (
        <>
          <TextInput style={themedInputStyle} placeholder="Username" value={forgotForm.username} onChangeText={(text) => setForgotForm({ ...forgotForm, username: text })} placeholderTextColor={colors.mutedText} autoCapitalize="none" />
          <TextInput style={themedInputStyle} placeholder="Email" value={forgotForm.email} onChangeText={(text) => setForgotForm({ ...forgotForm, email: text })} placeholderTextColor={colors.mutedText} autoCapitalize="none" />
          <TextInput style={themedInputStyle} placeholder="Contact Number" value={forgotForm.contact} onChangeText={(text) => setForgotForm({ ...forgotForm, contact: text })} placeholderTextColor={colors.mutedText} keyboardType="phone-pad" />
          {renderPasswordField({
            placeholder: 'New Password',
            value: forgotForm.newPassword,
            visible: showForgotPassword,
            onToggle: () => setShowForgotPassword((value) => !value),
            onChangeText: (text) => setForgotForm({ ...forgotForm, newPassword: text }),
          })}
          {renderPasswordField({
            placeholder: 'Confirm New Password',
            value: forgotForm.confirmNewPassword,
            visible: showForgotConfirmPassword,
            onToggle: () => setShowForgotConfirmPassword((value) => !value),
            onChangeText: (text) => setForgotForm({ ...forgotForm, confirmNewPassword: text }),
          })}
          <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.accent }]} onPress={handleForgotPassword}>
            <Text style={[styles.loginButtonText, { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' }]}>Reset Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => switchAuthMode('login')}>
            <Text style={[styles.authLink, { color: colors.darkBlue }]}>Back to Login</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <TextInput
          style={themedInputStyle}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor={colors.mutedText}
          autoCapitalize="none"
          returnKeyType="next"
        />
        {renderPasswordField({
          placeholder: 'Password',
          value: password,
          visible: showPassword,
          onToggle: () => setShowPassword((value) => !value),
          onChangeText: setPassword,
          onSubmitEditing: handleLogin,
          returnKeyType: 'go',
        })}
        <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.accent }]} onPress={handleLogin}>
          <Text style={[styles.loginButtonText, { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' }]}>
            {isResolvingApi ? 'Connecting...' : 'Login'}
          </Text>
        </TouchableOpacity>
        {!apiUrl && (
          <Text style={[styles.connectionText, { color: colors.mutedText }]}>
            {isResolvingApi ? 'Checking server connection...' : 'Server not connected yet. Tap Login to retry.'}
          </Text>
        )}
        <TouchableOpacity onPress={() => switchAuthMode('forgot')}>
          <Text style={[styles.authLink, { color: colors.darkBlue }]}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => switchAuthMode('signup')}>
          <Text style={[styles.authLink, { color: colors.darkBlue }]}>Create a New Account</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderActiveSection = () => {
    if (isWeb && !isLoggedIn) {
      return (
        <CompanyInfo
          colors={colors}
          apiBaseUrl={apiUrl}
          isActive
          isPublicWebView
        />
      );
    }

    if (activeTab === 'company') {
      return (
        <CompanyInfo
          colors={colors}
          apiBaseUrl={apiUrl}
          isActive
        />
      );
    }

    if (activeTab === 'payment') {
      return (
        <PaymentSection
          colors={colors}
          apiBaseUrl={apiUrl}
          user={currentUser}
          isActive
        />
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <UsageSection
          colors={colors}
          apiBaseUrl={apiUrl}
          user={currentUser}
          isActive
        />
      );
    }

    if (activeTab === 'maintenance') {
      return (
        <MaintenanceSection
          colors={colors}
        />
      );
    }

    return (
      <Dashboard
        colors={colors}
        apiBaseUrl={apiUrl}
        user={currentUser}
        isActive
        onLogout={handleLogout}
        onUserRefresh={handleUserRefresh}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isLaptopWeb && styles.webLaptopScale,
      ]}
    >
      <StatusBar
        barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Background Image with Blur - Applied to All Tabs */}
      <View style={styles.backgroundContainer}>
        <Image
          source={backgroundImageUri}
          style={[
            styles.backgroundImage,
            IS_WEB && { filter: 'blur(1px)' }
          ]}
        />
        <Animated.Image
          source={backgroundImageLightUri}
          style={[
            styles.backgroundImage,
            styles.backgroundImageOverlay,
            IS_WEB && { filter: 'blur(1px)' },
            { opacity: backgroundFadeAnim },
          ]}
        />
        <View
          style={[
            styles.backgroundOverlay,
            { backgroundColor: colors.mode === 'dark' ? 'rgba(8, 17, 33, 0.05)' : 'rgba(238, 244, 255, 0.1)' }
          ]}
        />
      </View>
      <Modal visible={showLoginModal && !isLoggedIn} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalBackdropHalo,
              { borderColor: colors.mode === 'dark' ? 'rgba(251, 191, 36, 0.16)' : 'rgba(42, 95, 191, 0.12)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropHaloSmall,
              { borderColor: colors.mode === 'dark' ? 'rgba(159, 176, 205, 0.12)' : 'rgba(234, 88, 12, 0.10)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropGrid,
              { borderColor: colors.mode === 'dark' ? 'rgba(159, 176, 205, 0.08)' : 'rgba(15, 23, 42, 0.06)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropBeam,
              { backgroundColor: colors.mode === 'dark' ? 'rgba(31, 50, 88, 0.35)' : 'rgba(42, 95, 191, 0.12)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropGlow,
              { backgroundColor: colors.mode === 'dark' ? 'rgba(42, 95, 191, 0.24)' : 'rgba(234, 88, 12, 0.16)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropAccent,
              { backgroundColor: colors.mode === 'dark' ? 'rgba(251, 191, 36, 0.16)' : 'rgba(42, 95, 191, 0.12)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropLineOne,
              { backgroundColor: colors.mode === 'dark' ? 'rgba(251, 191, 36, 0.28)' : 'rgba(42, 95, 191, 0.18)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropLineTwo,
              { backgroundColor: colors.mode === 'dark' ? 'rgba(159, 176, 205, 0.22)' : 'rgba(234, 88, 12, 0.14)' },
            ]}
          />
          <View
            style={[
              styles.modalBackdropOrb,
              { backgroundColor: colors.mode === 'dark' ? 'rgba(16, 163, 74, 0.12)' : 'rgba(234, 88, 12, 0.10)' },
            ]}
          />
          <Animated.View
            style={[
              styles.modalCard,
              isWeb && styles.modalCardWeb,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: modalOpacity,
                transform: [{ translateY: modalTranslateY }],
                width: isWeb && screenWidth < 480 ? '90%' : undefined,
                paddingHorizontal: isWeb && screenWidth < 480 ? 20 : undefined,
                paddingVertical: isWeb && screenWidth < 480 ? 20 : undefined,
                maxHeight: isWeb && screenWidth < 480 ? '90vh' : undefined,
                overflow: 'hidden',
              },
            ]}
          >
            {isWeb && (
              <TouchableOpacity
                onPress={() => setShowLoginModal(false)}
                style={[styles.modalCloseButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              >
                <FontAwesome name="xmark" size={18} color={colors.text} />
              </TouchableOpacity>
            )}
            {isWeb && (
              <Text style={[styles.modalEyebrow, { color: colors.accent }]}>
                Secure Account Access
              </Text>
            )}
            <Text style={[styles.modalTitle, isWeb && styles.modalTitleWeb, { color: colors.text }]}>Electripay</Text>
            {isWeb && (
              <Text style={[styles.modalIntro, { color: colors.mutedText }]}>
                Sign in to manage bills, monitor energy usage, and keep payment activity in one dashboard.
              </Text>
            )}
            {isWeb && screenWidth < 480 ? (
              <ScrollView
                style={styles.modalScrollContent}
                contentContainerStyle={{ paddingHorizontal: 4, width: '100%' }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {renderAuthContent()}
              </ScrollView>
            ) : (
              renderAuthContent()
            )}
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showTermsModal} transparent animationType="fade">
        <View style={[styles.termsOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.termsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.termsTitle, { color: colors.text }]}>Terms & Conditions</Text>
            <ScrollView style={styles.termsContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.termsText, { color: colors.text }]}>
                By creating an Electripay account, you agree to provide accurate information, keep your login credentials secure, and use the app responsibly for billing and payment activities only.
              </Text>
              <Text style={[styles.termsText, { color: colors.text }]}>
                Payment submissions may be verified before completion. Any suspicious, false, or abusive use of the platform may result in account restrictions.
              </Text>
              <Text style={[styles.termsText, { color: colors.text }]}>
                You also consent to the processing of your account details for billing support, usage insights, and customer service purposes.
              </Text>
            </ScrollView>
            <View style={styles.termsActions}>
              <TouchableOpacity
                style={[styles.termsActionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                onPress={() => {
                  setHasAcceptedTerms(false);
                  setShowTermsModal(false);
                }}
              >
                <Text style={[styles.termsActionText, { color: colors.text }]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.termsActionButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setHasAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
              >
                <Text style={[styles.termsActionText, { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' }]}>Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isWeb ? (
        <>
          <Navbar
            colors={colors}
            activeTab={activeTab}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onTabPress={handleTabPress}
            onLogout={handleLogout}
            onOpenAuth={openAuthModal}
            onToggleTheme={toggleTheme}
            themeMode={themeMode}
            isMobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={setMobileMenuOpen}
          />
          <ScrollView
            style={[styles.mainContent]}
            contentContainerStyle={[
              styles.webMainScrollContent,
              {
                paddingHorizontal: screenWidth < 480 ? 12 : 20,
                paddingBottom: 40,
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
          >
           
            {isLoggedIn ? (
              <View style={styles.webAppShell}>
                <View
                  style={[
                    styles.webPortalHeader,
                    screenWidth < 768 ? styles.webPortalHeaderMobile : null,
                    getContentGlassStyle('strong'),
                    { marginTop: screenWidth < 480 ? 12 : 0 },
                  ]}
                >
                  <View>
                    <Text style={[styles.webPortalEyebrow, { color: colors.accent }]}>
                      {activeTab.toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.webPortalTitle,
                        screenWidth < 480
                          ? styles.webPortalTitleXs
                          : screenWidth < 768
                            ? styles.webPortalTitleSm
                            : screenWidth < 1024
                              ? styles.webPortalTitleMd
                              : null,
                        activeTab === 'maintenance' && screenWidth < 480
                          ? styles.webPortalTitleMaintenanceXs
                          : null,
                        activeTab === 'maintenance' && screenWidth < 768
                          ? styles.webPortalTitleMaintenanceMobile
                          : null,
                        { color: colors.text },
                      ]}
                    >
                      {activeTab === 'dashboard'
                        ? 'Energy insights and account overview'
                        : activeTab === 'payment'
                          ? 'Payments and QR billing tools'
                          : activeTab === 'maintenance'
                            ? screenWidth < 480
                              ? 'Maintenance hotline and emergency reporting'
                              : 'Maintenance hotline and emergency reporting'
                            : 'Profile and account controls'}
                    </Text>
                  </View>
                </View>
                <Animated.View
                  style={[
                    styles.webContentFrame,
                    getContentGlassStyle('strong'),
                    {
                      opacity: webContentOpacity,
                      transform: [{ translateY: webContentTranslateY }],
                    },
                  ]}
                >
                  <View style={[styles.content, styles.contentWeb, styles.contentWebLoggedIn]}>
                    {renderActiveSection()}
                  </View>
                </Animated.View>
              </View>
            ) : (
              <View style={styles.pagerContainer}>
                <View style={[styles.content, styles.contentWeb]}>
                  {renderActiveSection()}
                </View>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.mainContent}>
          <Navbar
            colors={colors}
            activeTab={activeTab}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onTabPress={handleTabPress}
            onLogout={handleLogout}
            onOpenAuth={openAuthModal}
            onToggleTheme={toggleTheme}
            themeMode={themeMode}
            isMobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={setMobileMenuOpen}
          />
          <View style={styles.pagerContainer}>
            <ScrollView
              ref={pagerRef}
              style={styles.pager}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleSwipeEnd}
              contentOffset={{ x: tabs.indexOf(activeTab) * pageWidth, y: 0 }}
              bounces={false}
              overScrollMode="never"
            >
              <View style={[styles.page, { width: pageWidth }]}>
                <View style={styles.content}>
                  <CompanyInfo
                    colors={colors}
                    apiBaseUrl={apiUrl}
                    isActive={activeTab === 'company'}
                  />
                </View>
              </View>
              <View style={[styles.page, { width: pageWidth }]}>
                <View style={styles.content}>
                  <PaymentSection
                    colors={colors}
                    apiBaseUrl={apiUrl}
                    user={currentUser}
                    isActive={activeTab === 'payment'}
                  />
                </View>
              </View>
              <View style={[styles.page, { width: pageWidth }]}>
                <View style={styles.content}>
                  <UsageSection
                    colors={colors}
                    apiBaseUrl={apiUrl}
                    user={currentUser}
                    isActive={activeTab === 'dashboard'}
                  />
                </View>
              </View>
              <View style={[styles.page, { width: pageWidth }]}>
                <View style={styles.content}>
                  <Dashboard
                    colors={colors}
                    apiBaseUrl={apiUrl}
                    user={currentUser}
                    isActive={activeTab === 'profile'}
                    onLogout={handleLogout}
                    onUserRefresh={handleUserRefresh}
                  />
                </View>
              </View>
              <View style={[styles.page, { width: pageWidth }]}>
                <View style={styles.content}>
                  <MaintenanceSection
                    colors={colors}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      <View
        style={[
          styles.tabBar,
          isWeb && styles.tabBarWeb,
          { backgroundColor: colors.tabBarBg, borderTopColor: colors.border },
        ]}
      >
        <Animated.View
          style={[
            styles.tabIndicator,
            isWeb && styles.tabIndicatorWeb,
            {
              backgroundColor: colors.accent,
              transform: [{
                translateX: tabIndicatorAnim.interpolate({
                  inputRange: tabs.map((_, i) => i),
                  outputRange: tabs.map((_, i) => i * tabWidth),
                }),
              }],
            },
          ]}
        />

        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab)}
          >
            <Text
              style={[
                styles.tabText,
                isWeb && styles.tabTextWeb,
                { color: activeTab === tab ? colors.text : colors.mutedText },
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  webLaptopScale: {
    zoom: 1.12,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backgroundImageOverlay: {
    zIndex: 1,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 17, 33, 0.2)',
    zIndex: 1,
  },
  mainContent: { flex: 1, position: 'relative', zIndex: 2 },
  webMainScrollContent: {
    paddingBottom: 40,
    width: '100%',
    position: 'relative',
    zIndex: 2,
  },
  pagerContainer: { flex: 1, position: 'relative', zIndex: 2 },
  pager: { flex: 1, position: 'relative', zIndex: 2 },
  header: {
    display: 'none',
  },
  headerWeb: {
    display: 'none',
  },
  headerBrand: {
    display: 'none',
  },
  headerLogo: {
    display: 'none',
  },
  headerTitle: {
    display: 'none',
  },
  headerSubtitle: {
    display: 'none',
  },
  themeButton: {
    display: 'none',
  },
  themeButtonText: {
    display: 'none',
  },
  webHeaderActions: {
    display: 'none',
  },
  webHeaderButton: {
    display: 'none',
  },
  webHeaderButtonText: {
    display: 'none',
  },
  webThemeSwitch: {
    display: 'none',
  },
  webThemeSwitchLabel: {
    display: 'none',
  },
  webThemeSwitchTrack: {
    display: 'none',
  },
  webThemeSwitchThumb: {
    display: 'none',
  },
  webBurgerButton: {
    display: 'none',
  },
  webBurgerIcon: {
    display: 'none',
  },
  webBurgerLine: {
    display: 'none',
  },
  content: {
    padding: 16,
    width: '100%',
    flex: 1,
  },
  contentWeb: {
    alignSelf: 'center',
    maxWidth: 1180,
    width: '100%',
    paddingTop: 0,
  },
  contentWebLoggedIn: {
    maxWidth: '100%',
    padding: 0,
  },
  page: {
    flex: 1,
    height: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    height: 100,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 8,
  },
  tabBarWeb: {
    display: 'none',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 0,
  },
  tabTextWeb: {
    marginBottom: 0,
  },
  tabIndicator: {
    display: 'none',
  },
  tabIndicatorWeb: {
    display: 'none',
  },
  webBackdropTop: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 999,
    top: -120,
    left: '8%',
  },
  webBackdropSide: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 999,
    right: -80,
    top: '26%',
  },
  webBackdropGrid: {
    position: 'absolute',
    width: '88%',
    height: '88%',
    alignSelf: 'center',
    top: '7%',
    borderWidth: 1,
    borderRadius: 36,
  },
  webHero: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 28,
    marginTop: 18,
    marginBottom: 18,
    padding: 28,
    paddingVertical: 40,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(17, 29, 51, 0.45)',
    backdropFilter: 'blur(10px)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  webHeroCopy: {
    flex: 1.1,
    justifyContent: 'center',
  },
  webEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  webTitle: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '800',
    marginBottom: 12,
  },
  webDescription: {
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 520,
    marginBottom: 24,
  },
  webAuthButtons: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  webAuthButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webAuthButtonPrimary: {
    flex: 1,
  },
  webAuthButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webAuthButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  webStatsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  webStatCard: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    minHeight: 96,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  webStatValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  webStatLabel: {
    fontSize: 13,
    lineHeight: 19,
  },
  webSimpleHero: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 32,
    backgroundColor: 'rgba(17, 29, 51, 0.2)',
    backdropFilter: 'blur(15px)',
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  webSimpleHeroText: {
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 500,
  },
  webTabsWrap: {
    display: 'none',
  },
  webTabPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTabText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  webAppShell: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    gap: 16,
  },
  webMenuPanel: {
    display: 'none',
  },
  webMenuBackdrop: {
    display: 'none',
  },
  webDrawerItem: {
    display: 'none',
  },
  webDrawerThemeWrap: {
    display: 'none',
  },
  webDrawerItemText: {
    display: 'none',
  },
  webAppContent: {
    flex: 1,
    minWidth: 0,
  },
  webPortalHeader: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 24,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  webPortalHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  webPortalEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  webPortalTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    maxWidth: 760,
  },
  webPortalTitleMd: {
    fontSize: 24,
    lineHeight: 32,
    maxWidth: 620,
  },
  webPortalTitleSm: {
    fontSize: 20,
    lineHeight: 28,
    maxWidth: 500,
  },
  webPortalTitleXs: {
    fontSize: 17,
    lineHeight: 24,
    maxWidth: 320,
  },
  webPortalTitleMaintenanceXs: {
    fontSize: 15,
    lineHeight: 20,
    maxWidth: 260,
  },
  webPortalTitleMaintenanceMobile: {
    width: '100%',
    maxWidth: '100%',
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  webContentFrame: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 26,
    backgroundColor: 'rgba(17, 29, 51, 0.2)',
    backdropFilter: 'blur(15px)',
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalBackdropHalo: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 999,
    borderWidth: 1,
    top: '10%',
    left: -110,
  },
  modalBackdropHaloSmall: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    borderWidth: 1,
    bottom: '18%',
    right: -20,
  },
  modalBackdropGrid: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderWidth: 1,
    borderRadius: 28,
    transform: [{ rotate: '-8deg' }],
  },
  modalBackdropBeam: {
    position: 'absolute',
    width: 420,
    height: 120,
    borderRadius: 999,
    top: '28%',
    left: -80,
    transform: [{ rotate: '-24deg' }],
  },
  modalBackdropGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    top: '16%',
    right: -80,
  },
  modalBackdropAccent: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: '14%',
    left: -60,
  },
  modalBackdropLineOne: {
    position: 'absolute',
    width: 280,
    height: 2,
    borderRadius: 999,
    top: '24%',
    right: -30,
    transform: [{ rotate: '35deg' }],
  },
  modalBackdropLineTwo: {
    position: 'absolute',
    width: 180,
    height: 2,
    borderRadius: 999,
    bottom: '26%',
    left: -10,
    transform: [{ rotate: '-32deg' }],
  },
  modalBackdropOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    top: '42%',
    right: 24,
  },
  modalCard: {
    width: '88%',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  modalCardWeb: {
    width: '100%',
    maxWidth: 520,
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    backgroundColor: 'rgba(17, 29, 51, 0.25)',
    backdropFilter: 'blur(15px)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 999,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalCloseButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'ElectroFont1',
  },
  modalTitleWeb: {
    fontSize: 34,
    marginBottom: 12,
  },
  modalIntro: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
  },
  modalScrollContent: {
    width: '100%',
    maxHeight: 400,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  inputModern: {
    width: '100%',
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  passwordInputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    paddingLeft: 12,
    overflow: 'hidden',
  },
  passwordInputField: {
    flex: 1,
    paddingVertical: 12,
  },
  passwordToggle: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
/*  */    paddingVertical: 10,
  },
  passwordToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  termsButton: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  termsButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  termsAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    gap: 10,
  },
  termsCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsAgreeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  termsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  termsCard: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: '80%',
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  termsContent: {
    marginBottom: 14,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  termsActions: {
    flexDirection: 'row',
    gap: 10,
  },
  termsActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  loginButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
  authLink: {
    width: '100%',
    textAlign: 'center',
    color: '#ADD8E6',
    marginTop: 12,
    fontWeight: '600',
  },
  connectionText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
  },
});
