import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Auto close after 2.5 seconds
    setTimeout(() => {
      onFinish();
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/Electripay-final-logo-transparent.png")}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1E2E",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 220,
    height: 220,
  },
});