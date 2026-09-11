import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../constants/colors";
import { APP_CONFIG } from "../../constants/config";

const { width } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const loaderPosition = useRef(new Animated.Value(-50)).current;

  const node1Opacity = useRef(new Animated.Value(0.35)).current;
  const node2Opacity = useRef(new Animated.Value(0.35)).current;
  const node3Opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),

      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const loaderAnimation = Animated.loop(
      Animated.timing(loaderPosition, {
        toValue: 120,
        duration: 1300,
        useNativeDriver: true,
      })
    );

    loaderAnimation.start();

    const nodeAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(node1Opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),

          Animated.timing(node2Opacity, {
            toValue: 0.55,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(node2Opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),

          Animated.timing(node3Opacity, {
            toValue: 0.55,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(node3Opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),

          Animated.timing(node1Opacity, {
            toValue: 0.55,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    nodeAnimation.start();

    const timeout = setTimeout(() => {
      navigation.replace("Onboarding");
    }, APP_CONFIG.splashDuration);

    return () => {
      clearTimeout(timeout);
      loaderAnimation.stop();
      nodeAnimation.stop();
    };
  }, []);

  return (
    <LinearGradient
      colors={[
        "#102F20",
        "#163D27",
        "#174A2D",
        "#11351F",
      ]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Soft center glow */}
      <View style={styles.glow} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoBox,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <LinearGradient
          colors={["#C8DCB7", "#A8C995"]}
          style={styles.logoGradient}
        >
          <Ionicons
            name="leaf"
            size={42}
            color="#163B24"
          />
        </LinearGradient>
      </Animated.View>

      {/* App Name */}
      <Text style={styles.title}>
        AgriTrace
      </Text>

      {/* Tagline */}
      <Text style={styles.tagline}>
        Trace Every Harvest. Trust Every Journey.
      </Text>

      {/* Connected nodes */}
      <View style={styles.network}>
        <View
          style={[
            styles.connectionLine,
            styles.connectionLeft,
          ]}
        />

        <View
          style={[
            styles.connectionLine,
            styles.connectionRight,
          ]}
        />

        <Animated.View
          style={[
            styles.node,
            styles.nodeLeft,
            { opacity: node1Opacity },
          ]}
        />

        <Animated.View
          style={[
            styles.node,
            styles.nodeCenter,
            { opacity: node2Opacity },
          ]}
        />

        <Animated.View
          style={[
            styles.node,
            styles.nodeRight,
            { opacity: node3Opacity },
          ]}
        />
      </View>

      {/* Loading */}
      <View style={styles.loaderTrack}>
        <Animated.View
          style={[
            styles.loaderBar,
            {
              transform: [
                {
                  translateX: loaderPosition,
                },
              ],
            },
          ]}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  glow: {
    position: "absolute",

    width: width * 0.95,
    height: width * 0.95,

    borderRadius: width,

    backgroundColor: "rgba(100, 160, 95, 0.08)",

    top: "20%",
  },

  logoBox: {
    width: 116,
    height: 116,

    borderRadius: 32,

    backgroundColor: "rgba(170, 205, 150, 0.12)",

    padding: 10,

    marginBottom: 38,

    shadowColor: "#86B77C",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 22,

    elevation: 10,
  },

  logoGradient: {
    flex: 1,

    borderRadius: 26,

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontFamily: "Manrope_800ExtraBold",

    fontSize: 48,

    color: "#F4F7F3",

    letterSpacing: -2,

    marginBottom: 22,
  },

  tagline: {
    fontFamily: "Inter_500Medium",

    fontSize: 14,

    fontStyle: "italic",

    color: "rgba(242, 247, 239, 0.68)",

    textAlign: "center",
  },

  network: {
    position: "relative",

    width: 230,
    height: 75,

    marginTop: 70,
  },

  connectionLine: {
    position: "absolute",

    height: 1,

    width: 103,

    backgroundColor: "rgba(220, 238, 211, 0.24)",

    top: 31,
  },

  connectionLeft: {
    left: 16,
    transform: [{ rotate: "-11deg" }],
  },

  connectionRight: {
    right: 16,
    transform: [{ rotate: "11deg" }],
  },

  node: {
    position: "absolute",

    width: 13,
    height: 13,

    borderRadius: 7,

    backgroundColor: "#C4D8B4",

    shadowColor: "#C4D8B4",
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },

  nodeLeft: {
    left: 10,
    top: 32,
  },

  nodeCenter: {
    left: 108,
    top: 13,
  },

  nodeRight: {
    right: 10,
    top: 32,
  },

  loaderTrack: {
    position: "absolute",

    bottom: 135,

    width: 140,
    height: 4,

    borderRadius: 10,

    backgroundColor: "rgba(255,255,255,0.15)",

    overflow: "hidden",
  },

  loaderBar: {
    width: 50,
    height: 4,

    borderRadius: 10,

    backgroundColor: "#D4E6C9",
  },
});