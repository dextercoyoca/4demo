import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';

const IS_WEB = Platform.OS === 'web';

const Navbar = ({
  colors,
  activeTab,
  isLoggedIn,
  currentUser,
  onTabPress,
  onLogout,
  onOpenAuth,
  onToggleTheme,
  themeMode,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;
  const menuSlideAnim = useRef(new Animated.Value(isMobileMenuOpen ? 0 : -280)).current;
  const menuOpacityAnim = useRef(new Animated.Value(isMobileMenuOpen ? 1 : 0)).current;
  const themeToggleScaleAnim = useRef(new Animated.Value(1)).current;
  const themeBgTranslateAnim = useRef(new Animated.Value(themeMode === 'dark' ? 0 : 20)).current;
  const themeMoonOpacityAnim = useRef(new Animated.Value(themeMode === 'dark' ? 1 : 0.5)).current;
  const themeSunOpacityAnim = useRef(new Animated.Value(themeMode === 'light' ? 1 : 0.5)).current;
  const getGlassStyle = (variant = 'base') => {
    const darkMode = colors.mode === 'dark';
    const isStrong = variant === 'strong';
    const bg = darkMode
      ? isStrong
        ? 'rgba(15, 23, 42, 0.5)'
        : 'rgba(15, 23, 42, 0.36)'
      : isStrong
        ? 'rgba(255, 255, 255, 0.7)'
        : 'rgba(255, 255, 255, 0.54)';

    return {
      backgroundColor: bg,
      borderColor: darkMode ? 'rgba(148, 163, 184, 0.36)' : 'rgba(255, 255, 255, 0.76)',
      ...(IS_WEB
        ? {
            backdropFilter: 'blur(14px) saturate(135%)',
            WebkitBackdropFilter: 'blur(14px) saturate(135%)',
          }
        : {}),
    };
  };

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(themeToggleScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(themeToggleScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(themeBgTranslateAnim, {
        toValue: themeMode === 'dark' ? 0 : 20,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(themeMoonOpacityAnim, {
        toValue: themeMode === 'dark' ? 1 : 0.5,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(themeSunOpacityAnim, {
        toValue: themeMode === 'light' ? 1 : 0.5,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [themeMode]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      Animated.parallel([
        Animated.timing(menuSlideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(menuSlideAnim, {
          toValue: -280,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMobileMenuOpen]);

  const handleNavPress = (tab) => {
    onTabPress(tab);
    if (isMobile) onToggleMobileMenu(false);
  };

  const handleMenuClose = () => {
    onToggleMobileMenu(false);
  };

  const renderThemeToggle = () => (
    <Animated.View
      style={{
        transform: [{ scale: themeToggleScaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onToggleTheme}
        style={[styles.themeToggle, getGlassStyle()]}
        activeOpacity={0.7}
      >
        <Animated.View style={[
          styles.themeToggleBg,
          {
            backgroundColor: colors.accent,
            transform: [{ translateX: themeBgTranslateAnim }],
          },
        ]} />
        <Animated.View style={[styles.themeToggleIcon, { left: 6, opacity: themeMoonOpacityAnim }]}>
          <FontAwesome
            name="moon"
            size={14}
            color={colors.accent}
          />
        </Animated.View>
        <Animated.View style={[styles.themeToggleIcon, { right: 6, opacity: themeSunOpacityAnim }]}>
          <FontAwesome
            name="sun"
            size={14}
            color={colors.accent}
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderLogo = () => (
    <TouchableOpacity 
      onPress={() => {
        onTabPress(isLoggedIn ? 'dashboard' : 'company');
      }}
      style={styles.logoContainer}
      activeOpacity={0.7}
    >
      <Image
        source={require('../assets/Electripay-final-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.brandRow}>
        <Text style={[styles.brandText, isMobile && styles.brandTextMobile, { color: colors.text }]}>
          ELECTRIPAY
        </Text>
        {!isMobile && !isLoggedIn && (
          <Text style={[styles.brandSubtext, { color: colors.mutedText }]}>
            Track usage, pay bills, and manage your account in one place.
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderBurgerMenu = () => (
    <TouchableOpacity
      onPress={() => onToggleMobileMenu(!isMobileMenuOpen)}
      style={[styles.burgerButton, getGlassStyle()]}
      activeOpacity={0.7}
    >
      <View style={[styles.burgerLine, { backgroundColor: colors.text }]} />
      <View style={[styles.burgerLine, { backgroundColor: colors.text }]} />
      <View style={[styles.burgerLine, { backgroundColor: colors.text }]} />
    </TouchableOpacity>
  );

  const renderNavTabs = () => {
    if (isMobile || !isLoggedIn) return null;

    return (
      <View style={styles.navTabsContainer}>
        {['dashboard', 'payment', 'maintenance', 'profile'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleNavPress(tab)}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === tab ? colors.accent : 'transparent',
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: colors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeTab === tab ? (colors.mode === 'dark' ? '#0b1020' : '#ffffff') : colors.text,
                  fontWeight: activeTab === tab ? '600' : '500',
                },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderAuthButtons = () => {
    if (isMobile) return null;

    if (isLoggedIn) {
      return (
        <View style={styles.authButtonsContainer}>
          {renderThemeToggle()}
        </View>
      );
    }

    return (
      <View style={styles.authButtonsContainer}>
        <TouchableOpacity
          onPress={() => onOpenAuth('login')}
          style={[styles.loginButton, { borderColor: colors.accent }]}
        >
          <Text style={[styles.loginButtonText, { color: colors.accent }]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onOpenAuth('signup')}
          style={[styles.signupButton, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.signupButtonText, { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' }]}>
            Sign Up
          </Text>
        </TouchableOpacity>
        {renderThemeToggle()}
      </View>
    );
  };

  const renderMobileMenu = () => {
    if (!isMobile || !isMobileMenuOpen) return null;

    return (
      <>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleMenuClose}
          style={[
            styles.mobileMenuBackdrop,
            { backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: menuOpacityAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.mobileMenuPanel,
            {
              transform: [{ translateX: menuSlideAnim }],
            },
            getGlassStyle('strong'),
          ]}
        >
          <View style={styles.mobileMenuHeader}>
            <TouchableOpacity onPress={handleMenuClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>

          {isLoggedIn && (
            <>
              <View style={[styles.mobileMenuSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.mobileMenuSectionTitle, { color: colors.mutedText }]}>
                  NAVIGATION
                </Text>
                {['dashboard', 'payment', 'maintenance', 'profile'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => handleNavPress(tab)}
                    style={[
                      styles.mobileMenuItem,
                      {
                        backgroundColor: activeTab === tab ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.mobileMenuItemText,
                        {
                          color: activeTab === tab ? (colors.mode === 'dark' ? '#0b1020' : '#ffffff') : colors.text,
                        },
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.mobileMenuSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.mobileMenuSectionTitle, { color: colors.mutedText }]}>
                  ACCOUNT
                </Text>
                <View style={[styles.mobileUserInfo, getGlassStyle()]}>
                  <Text style={[styles.mobileUserName, { color: colors.text }]}>
                    {currentUser?.name || currentUser?.username || 'User'}
                  </Text>
                  <Text style={[styles.mobileUserEmail, { color: colors.mutedText }]}>
                    {currentUser?.email || 'No email'}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.mobileMenuSection}>
            <Text style={[styles.mobileMenuSectionTitle, { color: colors.mutedText }]}>
              SETTINGS
            </Text>
            <TouchableOpacity
              onPress={onToggleTheme}
              style={[
                styles.mobileMenuItem,
                getGlassStyle(),
                { paddingVertical: 12 },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome
                  name={themeMode === 'dark' ? 'sun' : 'moon'}
                  size={16}
                  color={colors.accent}
                />
                <Text style={[styles.mobileMenuItemText, { color: colors.text }]}>
                  {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {!isLoggedIn && (
            <View style={styles.mobileMenuSection}>
              <TouchableOpacity
                onPress={() => {
                  onOpenAuth('login');
                  handleMenuClose();
                }}
                style={[styles.mobileMenuItem, { borderColor: colors.accent, borderWidth: 1 }]}
              >
                <Text style={[styles.mobileMenuItemText, { color: colors.accent }]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onOpenAuth('signup');
                  handleMenuClose();
                }}
                style={[styles.mobileMenuItem, { backgroundColor: colors.accent, marginTop: 8 }]}
              >
                <Text
                  style={[
                    styles.mobileMenuItemText,
                    { color: colors.mode === 'dark' ? '#0b1020' : '#ffffff' },
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </>
    );
  };

  return (
    <>
      <View
        style={[
          styles.navbar,
          getGlassStyle('strong'),
        ]}
      >
        <View
          style={[
            styles.navbarContent,
            {
              paddingHorizontal: isMobile ? 12 : 20,
            },
          ]}
        >
          <View style={styles.logoAndNavContainer}>
            {renderLogo()}
            {isLoggedIn && !isMobile && renderNavTabs()}
          </View>

          <View style={styles.rightSection}>
            {isMobile && isLoggedIn && renderBurgerMenu()}
            {isMobile && !isLoggedIn && (
              <View style={styles.mobileAuthButtons}>
                {renderThemeToggle()}
                <TouchableOpacity
                  onPress={() => onOpenAuth('login')}
                  style={[styles.mobileAuthIconButton, { borderColor: colors.accent, borderWidth: 1.5 }]}
                  title="Login"
                >
                  <FontAwesome
                    name="arrow-right-to-bracket"
                    size={20}
                    color={colors.accent}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onOpenAuth('signup')}
                  style={[styles.mobileAuthIconButton, { backgroundColor: colors.accent }]}
                  title="Sign Up"
                >
                  <FontAwesome
                    name="circle-user"
                    size={20}
                    color={colors.mode === 'dark' ? '#0b1020' : '#ffffff'}
                  />
                </TouchableOpacity>
              </View>
            )}
            {renderAuthButtons()}
          </View>
        </View>
      </View>
      {renderMobileMenu()}
    </>
  );
};

const styles = StyleSheet.create({
  navbar: {
    height: 72,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 8,
    flex: 1,
  },
  logoAndNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    paddingVertical: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginTop: 2,
    flexShrink: 0,
  },
  brandText: {
    fontFamily: 'ElectroFont1',
    fontSize: 30,
    letterSpacing: 0.8,
    lineHeight: 34,
  },
  brandTextMobile: {
    fontSize: 22,
    lineHeight: 26,
  },
  brandSubtext: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    maxWidth: 430,
    color: '#999',
    flexShrink: 1,
  },
  navTabsContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginLeft: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    transition: 'all 200ms ease',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  authButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  loginButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signupButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  signupButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  themeToggle: {
    width: 55,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  themeToggleBg: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    left: 5,
  },
  themeToggleIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    overflow: 'hidden',
  },
  burgerButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  burgerLine: {
    width: 20,
    height: 2.5,
    borderRadius: 1.25,
  },
  mobileAuthButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileAuthIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Mobile Menu
  mobileMenuBackdrop: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 49,
  },
  mobileMenuPanel: {
    position: 'absolute',
    top: 64,
    left: 0,
    width: 280,
    bottom: 0,
    zIndex: 50,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  mobileMenuSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mobileMenuSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  mobileMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 4,
  },
  mobileMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mobileUserInfo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  mobileUserName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  mobileUserEmail: {
    fontSize: 12,
  },
});

export default Navbar;
