import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../constants/colors";

// REAL BACKEND
import {
  extractTrackingId,
  getPublicTrace,
} from "../../api/publicTraceApi";

import {
  getDevice,
} from "../../api/deviceApi";

export default function ScanShipmentScreen({ navigation }) {
  const [mode, setMode] = useState("shipment");

  const [permission, requestPermission] =
    useCameraPermissions();

  const [torch, setTorch] =
    useState(false);

  const [scanned, setScanned] =
    useState(false);

  const [manualOpen, setManualOpen] =
    useState(false);

  const [manual, setManual] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const scanY =
    useRef(
      new Animated.Value(8)
    ).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          scanY,
          {
            toValue: 210,
            duration: 1100,
            useNativeDriver: true,
          }
        ),
        Animated.timing(
          scanY,
          {
            toValue: 8,
            duration: 1100,
            useNativeDriver: true,
          }
        ),
      ])
    );

    loop.start();

    return () =>
      loop.stop();
  }, []);

  // =====================================================
  // REAL QR BACKEND HANDLER
  // =====================================================

  const handleCode =
    async (raw) => {
      if (
        scanned ||
        loading
      ) {
        return;
      }

      const code =
        String(
          raw || ""
        ).trim();

      if (!code) {
        return;
      }

      setScanned(true);
      setLoading(true);

      try {
        /*
         * DEVICE QR
         *
         * Example:
         * AGR-NODE-001
         *
         * or whatever real deviceId
         * exists in MongoDB.
         */
        if (
          mode ===
            "device" ||
          code.startsWith(
            "AGR-NODE"
          ) ||
          code.startsWith(
            "DEV-"
          )
        ) {
          const device =
            await getDevice(
              code
            );

          setResult({
            type: "device",
            data: device,
          });

          return;
        }

        /*
         * SHIPMENT QR
         *
         * QR may contain:
         *
         * AGT-2026-00001
         *
         * OR:
         *
         * https://...
         * /trace/
         * AGT-2026-00001
         *
         * extractTrackingId()
         * handles both.
         */

        const trackingId =
          extractTrackingId(
            code
          );

        if (!trackingId) {
          throw new Error(
            "Invalid shipment QR."
          );
        }

        const trace =
          await getPublicTrace(
            trackingId
          );

        setResult({
          type:
            "shipment",
          data: trace,
        });
      } catch (error) {
        console.log(
          "QR ERROR:",
          error
        );

        Alert.alert(
          "QR Not Recognized",
          error?.message ||
            "This QR code was not found in AgriTrace."
        );

        setScanned(
          false
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  // =====================================================
  // PERMISSIONS
  // =====================================================

  if (!permission) {
    return (
      <View
        style={
          styles.dark
        }
      />
    );
  }

  if (
    !permission.granted
  ) {
    return (
      <View
        style={
          styles.permission
        }
      >
        <Ionicons
          name="camera-outline"
          size={50}
          color={
            COLORS.green
          }
        />

        <Text
          style={
            styles.permissionTitle
          }
        >
          Camera permission
          required
        </Text>

        <TouchableOpacity
          style={
            styles.permissionBtn
          }
          onPress={
            requestPermission
          }
        >
          <Text
            style={
              styles.permissionBtnText
            }
          >
            Allow Camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <View
      style={
        styles.dark
      }
    >
      <CameraView
        style={
          StyleSheet.absoluteFill
        }
        facing="back"
        enableTorch={
          torch
        }
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
          ],
        }}
        onBarcodeScanned={
          scanned
            ? undefined
            : ({
                data,
              }) =>
                handleCode(
                  data
                )
        }
      />

      <View
        style={
          styles.overlay
        }
      />

      {/* ================= TOP BAR ================= */}

      <View
        style={
          styles.top
        }
      >
        <TouchableOpacity
          style={
            styles.circle
          }
          onPress={() =>
            navigation.navigate(
              "Home"
            )
          }
        >
          <Ionicons
            name="close"
            size={22}
            color={
              COLORS.white
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.toggle
          }
        >
          {[
            "shipment",
            "device",
          ].map(
            (x) => (
              <TouchableOpacity
                key={
                  x
                }
                onPress={() => {
                  setMode(
                    x
                  );

                  setScanned(
                    false
                  );

                  setResult(
                    null
                  );
                }}
                style={[
                  styles.toggleBtn,
                  mode ===
                    x &&
                    styles.toggleActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    mode ===
                      x &&
                      styles.toggleTextActive,
                  ]}
                >
                  {x ===
                  "shipment"
                    ? "Shipment QR"
                    : "Device QR"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <TouchableOpacity
          style={
            styles.circle
          }
          onPress={() =>
            setTorch(
              (
                previous
              ) =>
                !previous
            )
          }
        >
          <Ionicons
            name={
              torch
                ? "flash"
                : "flash-outline"
            }
            size={20}
            color={
              COLORS.white
            }
          />
        </TouchableOpacity>
      </View>

      {/* ================= SCANNER FRAME ================= */}

      <View
        style={
          styles.center
        }
      >
        <View
          style={
            styles.frame
          }
        >
          <Corner
            pos="tl"
          />

          <Corner
            pos="tr"
          />

          <Corner
            pos="bl"
          />

          <Corner
            pos="br"
          />

          <Animated.View
            style={[
              styles.scanLine,
              {
                transform:
                  [
                    {
                      translateY:
                        scanY,
                    },
                  ],
              },
            ]}
          />
        </View>

        <Text
          style={
            styles.hint
          }
        >
          {loading
            ? "Checking AgriTrace backend..."
            : "Position the AgriTrace QR code inside the frame."}
        </Text>
      </View>

      {/* ================= BOTTOM ACTIONS ================= */}

      <View
        style={
          styles.bottom
        }
      >
        <TouchableOpacity
          style={
            styles.quick
          }
          onPress={() =>
            Alert.alert(
              "Gallery",
              "Gallery QR scanning can be added after the live QR flow."
            )
          }
        >
          <Ionicons
            name="image-outline"
            size={21}
            color={
              COLORS.white
            }
          />

          <Text
            style={
              styles.quickText
            }
          >
            Gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.simulate
          }
          disabled={
            loading
          }
          onPress={() =>
            handleCode(
              mode ===
                "device"
                ? "AGR-NODE-001"
                : "AGT-2026-00001"
            )
          }
        >
          <Ionicons
            name="qr-code"
            size={24}
            color={
              COLORS.white
            }
          />

          <Text
            style={
              styles.simText
            }
          >
            {loading
              ? "Checking..."
              : "Simulate Scan"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.quick
          }
          onPress={() =>
            setManualOpen(
              true
            )
          }
        >
          <Ionicons
            name="keypad-outline"
            size={21}
            color={
              COLORS.white
            }
          />

          <Text
            style={
              styles.quickText
            }
          >
            Enter Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          RESULT MODAL
      ================================================= */}

      <Modal
        transparent
        visible={
          !!result
        }
        animationType="slide"
        onRequestClose={() => {
          setResult(
            null
          );

          setScanned(
            false
          );
        }}
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.sheet
            }
          >
            <View
              style={
                styles.grabber
              }
            />

            <View
              style={
                styles.resultIcon
              }
            >
              <Ionicons
                name={
                  result?.type ===
                  "device"
                    ? "hardware-chip-outline"
                    : "qr-code-outline"
                }
                size={
                  27
                }
                color={
                  COLORS.forest
                }
              />
            </View>

            <Text
              style={
                styles.sheetTitle
              }
            >
              {result?.type ===
              "device"
                ? "Device Detected"
                : "Public Trace Verified"}
            </Text>

            <Text
              style={
                styles.sheetSub
              }
            >
              {result?.type ===
              "device"
                ? result?.data
                    ?.deviceId
                : result?.data
                    ?.trackingId}
            </Text>

            {/* DEVICE RESULT */}

            {result?.type ===
            "device" ? (
              <Info
                rows={[
                  [
                    "Device",
                    result
                      ?.data
                      ?.deviceId,
                  ],
                  [
                    "Status",
                    result
                      ?.data
                      ?.status,
                  ],
                  [
                    "Battery",
                    result
                      ?.data
                      ?.battery !=
                    null
                      ? `${result.data.battery}%`
                      : "—",
                  ],
                  [
                    "Shipment",
                    result
                      ?.data
                      ?.currentShipmentId ||
                      "Unassigned",
                  ],
                ]}
              />
            ) : (
              // SHIPMENT RESULT
              <Info
                rows={[
                  [
                    "Shipment",
                    result
                      ?.data
                      ?.shipmentId,
                  ],
                  [
                    "Tracking ID",
                    result
                      ?.data
                      ?.trackingId,
                  ],
                  [
                    "Product",
                    result
                      ?.data
                      ?.productName ||
                      result
                        ?.data
                        ?.product,
                  ],
                  [
                    "Status",
                    result
                      ?.data
                      ?.status,
                  ],
                  [
                    "Origin",
                    result
                      ?.data
                      ?.source ||
                      result
                        ?.data
                        ?.origin ||
                      "—",
                  ],
                  [
                    "Destination",
                    result
                      ?.data
                      ?.destination ||
                      "—",
                  ],
                  [
                    "Integrity",
                    result
                      ?.data
                      ?.integrity
                      ?.status ||
                      "—",
                  ],
                ]}
              />
            )}

            {/* ================= RESULT BUTTONS ================= */}

            <View
              style={
                styles.sheetBtns
              }
            >
              <TouchableOpacity
                style={
                  styles.sheetGhost
                }
                onPress={() => {
                  const r =
                    result;

                  setResult(
                    null
                  );

                  setScanned(
                    false
                  );

                  if (
                    r.type ===
                    "device"
                  ) {
                    navigation.navigate(
                      "DeviceDetails",
                      {
                        deviceId:
                          r.data
                            .deviceId,
                      }
                    );
                  } else {
                    navigation.navigate(
                      "ShipmentDetails",
                      {
                        shipmentId:
                          r.data
                            .shipmentId,
                      }
                    );
                  }
                }}
              >
                <Text
                  style={
                    styles.sheetGhostText
                  }
                >
                  {result?.type ===
                  "device"
                    ? "View Device"
                    : "View Shipment"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.sheetPrimary
                }
                onPress={() => {
                  const r =
                    result;

                  setResult(
                    null
                  );

                  setScanned(
                    false
                  );

                  if (
                    r.type ===
                    "device"
                  ) {
                    navigation.navigate(
                      "AssignDevice",
                      {
                        deviceId:
                          r.data
                            .deviceId,
                      }
                    );
                  } else {
                    /*
                     * IMPORTANT:
                     *
                     * Your current backend
                     * does not expose a
                     * dedicated
                     * "confirm pickup"
                     * endpoint from the
                     * public trace API.
                     *
                     * Therefore don't fake
                     * successful pickup.
                     *
                     * We can later connect
                     * this to your real
                     * shipment-status route.
                     */

                    Alert.alert(
                      "Shipment Verified",
                      "The shipment was successfully verified from the AgriTrace backend."
                    );
                  }
                }}
              >
                <Text
                  style={
                    styles.sheetPrimaryText
                  }
                >
                  {result?.type ===
                  "device"
                    ? "Assign to Shipment"
                    : "Verified"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================
          MANUAL CODE MODAL
      ================================================= */}

      <Modal
        transparent
        visible={
          manualOpen
        }
        animationType="fade"
        onRequestClose={() =>
          setManualOpen(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.sheet
            }
          >
            <View
              style={
                styles.grabber
              }
            />

            <Text
              style={
                styles.sheetTitle
              }
            >
              Enter Code
              Manually
            </Text>

            <TextInput
              value={
                manual
              }
              onChangeText={
                setManual
              }
              placeholder={
                mode ===
                "device"
                  ? "e.g. AGR-NODE-001"
                  : "e.g. AGT-2026-00001"
              }
              placeholderTextColor={
                COLORS.muted
              }
              autoCapitalize="characters"
              autoCorrect={
                false
              }
              style={
                styles.manualInput
              }
            />

            <View
              style={
                styles.sheetBtns
              }
            >
              <TouchableOpacity
                style={
                  styles.sheetGhost
                }
                onPress={() => {
                  setManualOpen(
                    false
                  );

                  setManual(
                    ""
                  );
                }}
              >
                <Text
                  style={
                    styles.sheetGhostText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.sheetPrimary
                }
                onPress={() => {
                  const code =
                    manual.trim();

                  setManualOpen(
                    false
                  );

                  setManual(
                    ""
                  );

                  // Important:
                  // allow the manual
                  // request to execute
                  setScanned(
                    false
                  );

                  setTimeout(
                    () =>
                      handleCode(
                        code
                      ),
                    100
                  );
                }}
              >
                <Text
                  style={
                    styles.sheetPrimaryText
                  }
                >
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =====================================================
// SMALL COMPONENTS
// =====================================================

function Corner({
  pos,
}) {
  return (
    <View
      style={[
        styles.corner,
        styles[pos],
      ]}
    />
  );
}

function Info({
  rows,
}) {
  return (
    <View
      style={
        styles.info
      }
    >
      {rows.map(
        ([
          label,
          value,
        ]) => (
          <View
            key={
              label
            }
            style={
              styles.infoRow
            }
          >
            <Text
              style={
                styles.infoLabel
              }
            >
              {label}
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {value ??
                "—"}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

// =====================================================
// YOUR ORIGINAL STYLES
// =====================================================

const styles =
  StyleSheet.create({
    dark: {
      flex: 1,
      backgroundColor:
        "#0B1512",
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(11,21,18,.45)",
    },

    top: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingTop: 48,
      paddingHorizontal: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    circle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        "rgba(255,255,255,.14)",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    toggle: {
      flexDirection:
        "row",
      backgroundColor:
        "rgba(255,255,255,.1)",
      borderRadius: 99,
      padding: 3,
    },

    toggleBtn: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 99,
    },

    toggleActive: {
      backgroundColor:
        COLORS.white,
    },

    toggleText: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 11,
      color:
        "rgba(255,255,255,.75)",
    },

    toggleTextActive: {
      color:
        COLORS.forest,
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 20,
    },

    frame: {
      width: 230,
      height: 230,
      borderRadius: 20,
      backgroundColor:
        "rgba(255,255,255,.03)",
      overflow:
        "hidden",
    },

    corner: {
      position:
        "absolute",
      width: 35,
      height: 35,
      borderColor:
        COLORS.emerald,
    },

    tl: {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 16,
    },

    tr: {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 16,
    },

    bl: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 16,
    },

    br: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 16,
    },

    scanLine: {
      position:
        "absolute",
      left: 8,
      right: 8,
      top: 0,
      height: 2,
      backgroundColor:
        COLORS.emerald,
    },

    hint: {
      fontFamily:
        "Inter_500Medium",
      fontSize: 12.5,
      color:
        "rgba(255,255,255,.78)",
      textAlign:
        "center",
      maxWidth: 260,
    },

    bottom: {
      position:
        "absolute",
      left: 20,
      right: 20,
      bottom: 28,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    quick: {
      alignItems:
        "center",
      gap: 6,
      width: 72,
    },

    quickText: {
      fontFamily:
        "Inter_600SemiBold",
      fontSize: 10.5,
      color:
        "rgba(255,255,255,.85)",
    },

    simulate: {
      alignItems:
        "center",
      gap: 7,
      backgroundColor:
        COLORS.green,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 15,
    },

    simText: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 10.5,
      color:
        COLORS.white,
    },

    permission: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.background,
      padding: 30,
    },

    permissionTitle: {
      fontFamily:
        "Manrope_800ExtraBold",
      fontSize: 18,
      color:
        COLORS.text,
      marginVertical: 15,
    },

    permissionBtn: {
      backgroundColor:
        COLORS.green,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },

    permissionBtnText: {
      fontFamily:
        "Inter_700Bold",
      color:
        COLORS.white,
    },

    modalOverlay: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "rgba(11,21,18,.5)",
    },

    sheet: {
      backgroundColor:
        COLORS.white,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 22,
      paddingBottom: 32,
      paddingTop: 10,
    },

    grabber: {
      width: 40,
      height: 4,
      borderRadius: 4,
      backgroundColor:
        COLORS.border,
      alignSelf:
        "center",
      marginBottom: 16,
    },

    resultIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor:
        COLORS.greenLight,
      alignSelf:
        "center",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sheetTitle: {
      fontFamily:
        "Manrope_800ExtraBold",
      fontSize: 17,
      color:
        COLORS.text,
      textAlign:
        "center",
      marginTop: 8,
    },

    sheetSub: {
      fontFamily:
        "Inter_400Regular",
      fontSize: 12,
      color:
        COLORS.muted,
      textAlign:
        "center",
      marginTop: 3,
    },

    info: {
      backgroundColor:
        COLORS.backgroundBlue,
      borderRadius: 12,
      padding: 14,
      marginVertical: 14,
    },

    infoRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      paddingVertical: 5,
      gap: 20,
    },

    infoLabel: {
      fontFamily:
        "Inter_400Regular",
      fontSize: 12.5,
      color:
        COLORS.muted,
    },

    infoValue: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 12.5,
      color:
        COLORS.text,
      flex: 1,
      textAlign:
        "right",
    },

    sheetBtns: {
      flexDirection:
        "row",
      gap: 10,
    },

    sheetGhost: {
      flex: 1,
      alignItems:
        "center",
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.backgroundBlue,
    },

    sheetGhostText: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 12,
      color:
        COLORS.text,
    },

    sheetPrimary: {
      flex: 1,
      alignItems:
        "center",
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor:
        COLORS.green,
    },

    sheetPrimaryText: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 12,
      color:
        COLORS.white,
    },

    manualInput: {
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.backgroundBlue,
      borderRadius: 12,
      paddingHorizontal: 14,
      minHeight: 48,
      fontFamily:
        "Inter_400Regular",
      marginVertical: 16,
      color:
        COLORS.text,
    },
  });