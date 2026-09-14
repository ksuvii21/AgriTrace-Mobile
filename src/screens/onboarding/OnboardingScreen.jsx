import React, {
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from "react-native";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import COLORS from "../../constants/colors";
import Button from "../../components/common/Button";
import { useLanguage } from "../../context/LanguageContext";

const { width } =
  Dimensions.get("window");

function getSlides(t) {
  return [
    {
      id: "1",
      title: t("onboarding_slide1_title"),
      description: t("onboarding_slide1_desc"),
      type: "journey",
    },

    {
      id: "2",
      title: t("onboarding_slide2_title"),
      description: t("onboarding_slide2_desc"),
      type: "temperature",
    },

    {
      id: "3",
      title: t("onboarding_slide3_title"),
      description: t("onboarding_slide3_desc"),
      type: "verify",
    },
  ];
}

function SlideVisual({ type }) {
  if (type === "journey") {
    return (
      <View style={styles.journeyBox}>
        <MaterialCommunityIcons
          name="tractor"
          size={28}
          color={COLORS.green}
        />

        <Ionicons
          name="arrow-forward"
          size={16}
          color={COLORS.muted}
        />

        <MaterialCommunityIcons
          name="truck-outline"
          size={29}
          color={COLORS.green}
        />

        <Ionicons
          name="arrow-forward"
          size={16}
          color={COLORS.muted}
        />

        <MaterialCommunityIcons
          name="warehouse"
          size={29}
          color={COLORS.green}
        />

        <Ionicons
          name="arrow-forward"
          size={16}
          color={COLORS.muted}
        />

        <MaterialCommunityIcons
          name="store-outline"
          size={28}
          color={COLORS.green}
        />
      </View>
    );
  }

  return (
    <View style={styles.singleVisual}>
      <MaterialCommunityIcons
        name={
          type === "temperature"
            ? "thermometer"
            : "shield-check-outline"
        }
        size={56}
        color={COLORS.green}
      />
    </View>
  );
}

export default function OnboardingScreen({
  navigation,
}) {
  const { t } = useLanguage();
  const slides = getSlides(t);

  const [index, setIndex] =
    useState(0);

  const listRef = useRef(null);

  const goToLogin = () => {
    navigation.replace("Login");
  };

  const handleNext = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    } else {
      goToLogin();
    }
  };

  const handleScrollEnd = (
    event
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x /
        width
    );

    setIndex(nextIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <TouchableOpacity
          onPress={goToLogin}
        >
          <Text style={styles.skip}>
            {t("onboarding_skip")}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) =>
          item.id
        }
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={
          false
        }
        onMomentumScrollEnd={
          handleScrollEnd
        }
        renderItem={({ item }) => (
          <View
            style={styles.slide}
          >
            <SlideVisual
              type={item.type}
            />

            <Text
              style={styles.title}
            >
              {item.title}
            </Text>

            <Text
              style={
                styles.description
              }
            >
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index &&
                styles.activeDot,
            ]}
          />
        ))}
      </View>

      <View
        style={styles.action}
      >
        <Button
          title={
            index ===
            slides.length - 1
              ? t("onboarding_get_started")
              : t("onboarding_next")
          }
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.background,
      paddingTop: 50,
    },

    skipRow: {
      paddingHorizontal: 22,
      alignItems: "flex-end",
    },

    skip: {
      fontFamily:
        "Inter_700Bold",

      color: COLORS.blue,

      fontSize: 13.5,
    },

    slide: {
      width,

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 34,
    },

    journeyBox: {
      flexDirection: "row",

      alignItems: "center",

      gap: 7,

      paddingHorizontal: 20,
      paddingVertical: 24,

      backgroundColor:
        COLORS.greenLight,

      borderRadius: 22,

      marginBottom: 26,
    },

    singleVisual: {
      width: 110,
      height: 110,

      borderRadius: 22,

      backgroundColor:
        COLORS.greenLight,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 26,
    },

    title: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 21,

      color: COLORS.text,

      textAlign: "center",

      marginBottom: 12,
    },

    description: {
      fontFamily:
        "Inter_400Regular",

      color: COLORS.muted,

      fontSize: 13.5,

      lineHeight: 21,

      textAlign: "center",

      maxWidth: 290,
    },

    dots: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      paddingVertical: 13,
    },

    dot: {
      width: 7,
      height: 7,

      borderRadius: 10,

      backgroundColor:
        COLORS.border,
    },

    activeDot: {
      width: 22,

      backgroundColor:
        COLORS.green,
    },

    action: {
      paddingHorizontal: 22,

      paddingBottom: 30,
      paddingTop: 8,
    },
  });