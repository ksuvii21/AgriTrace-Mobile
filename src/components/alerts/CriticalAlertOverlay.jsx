/**
 * CriticalAlertOverlay
 * --------------------
 * Globally mounted gate that forces the critical alert to the front,
 * no matter which screen the user is on (dashboard, shipments, scan…).
 *
 * Rendering it as a full-screen RN `Modal` guarantees:
 *  - it sits above the tab bar and stack;
 *  - it is not dismissible by swipe/back (we never call onRequestClose);
 *  - it survives navigation between screens.
 */

import React from "react";
import { Modal, StyleSheet, View } from "react-native";

import CriticalAlertScreen from "../../screens/alerts/CriticalAlertScreen";
import { useAlerts } from "../../context/AlertContext";

export default function CriticalAlertOverlay({ navigation }) {
  const { activeAlert } = useAlerts();

  return (
    <Modal
      visible={!!activeAlert}
      animationType="fade"
      transparent={false}
      // Intentionally no onRequestClose: back/escape must not silence it.
      onRequestClose={() => {}}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.container}>
        <CriticalAlertScreen navigation={navigation} route={{ params: {} }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A0500" },
});