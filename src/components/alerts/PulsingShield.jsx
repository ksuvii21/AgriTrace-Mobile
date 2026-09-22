/**
 * PulsingShield
 * -------------
 * The emergency centrepiece: a shield/warning icon wrapped in expanding
 * red rings and breathing softly.
 *
 * Performance/UX notes:
 *  - Animations use the native driver (transform + opacity only).
 *  - Motion is restrained (no full-screen flashing) so text stays readable.
 *  - `pulsing=false` freezes the animation — used once an alert is
 *    acknowledged, satisfying "stop flashing/pulsing emergency animation".
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PulsingShield({
  pulsing = true,
  size = 132,
  color = "#DC4545",
  iconColor = "#FFFFFF",
  iconName = "shield-half",
}) {
  const coreScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.55)).current;

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) {
      coreScale.stopAnimation();
      glow.stopAnimation();
      coreScale.setValue(1);
      glow.setValue(0.55);
      ring1.setValue(0);
      ring2.setValue(0);
      ring3.setValue(0);
      return;
    }

    const buildRing = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const coreLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coreScale, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coreScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.5,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const r1 = buildRing(ring1, 0);
    const r2 = buildRing(ring2, 800);
    const r3 = buildRing(ring3, 1600);

    coreLoop.start();
    glowLoop.start();
    r1.start();
    r2.start();
    r3.start();

    return () => {
      coreLoop.stop();
      glowLoop.stop();
      r1.stop();
      r2.stop();
      r3.stop();
    };
  }, [pulsing, coreScale, glow, ring1, ring2, ring3]);

  const ringBase = size * 1.05;

  const ringStyle = (value, scaleTo) => ({
    width: ringBase,
    height: ringBase,
    borderRadius: ringBase / 2,
    borderWidth: 2,
    borderColor: color,
    position: "absolute",
    opacity: value.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0, 0.5, 0],
    }),
    transform: [
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [1, scaleTo],
        }),
      },
    ],
  });

  return (
    <View
      style={[styles.wrap, { width: ringBase, height: ringBase }]}
      accessibilityRole="image"
      accessibilityLabel="Critical warning"
      pointerEvents="none"
    >
      <Animated.View style={ringStyle(ring1, 1.6)} />
      <Animated.View style={ringStyle(ring2, 1.35)} />
      <Animated.View style={ringStyle(ring3, 1.15)} />

      <Animated.View
        style={[
          styles.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
            transform: [{ scale: coreScale }],
            opacity: glow,
          },
        ]}
      >
        <Ionicons name={iconName} size={size * 0.46} color={iconColor} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  core: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 26,
    elevation: 18,
  },
});