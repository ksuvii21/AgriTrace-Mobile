import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import COLORS from "../../constants/colors";

import {
  getDashboardSummary,
} from "../../api/dashboardApi";

import {
  getLatestTelemetryByShipment,
} from "../../api/telemetryApi";

import {
  normalizeShipment,
} from "../../utils/apiMappers";

import {
  useAuth,
} from "../../hooks/useAuth";

import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

import ShipmentStatus from "../../components/shipment/ShipmentStatus";

export default function DashboardScreen({
  navigation,
}) {
  const { profile } = useAuth();

  const [summary, setSummary] =
    useState(null);

  const [shipment, setShipment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD REAL DASHBOARD DATA
  |--------------------------------------------------------------------------
  */

  const loadDashboard =
    useCallback(async () => {
      try {
        setError(null);

        const data =
          await getDashboardSummary();

        setSummary(data);

        /*
        |--------------------------------------------------------------------------
        | Pick current shipment
        |--------------------------------------------------------------------------
        */

        const currentShipment =
          (
            data?.recentShipments || []
          ).find(
            (item) =>
              ![
                "DELIVERED",
                "CANCELLED",
              ].includes(item.status)
          ) ||
          data?.recentShipments?.[0];

        if (!currentShipment) {
          setShipment(null);
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Get latest telemetry
        |--------------------------------------------------------------------------
        */

        let telemetry = null;

        try {
          telemetry =
            await getLatestTelemetryByShipment(
              currentShipment.shipmentId
            );
        } catch (
          telemetryError
        ) {
          console.log(
            "Telemetry unavailable:",
            telemetryError?.message
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize backend data
        |--------------------------------------------------------------------------
        */

        const normalizedShipment =
          normalizeShipment(
            currentShipment,
            telemetry
          );

        setShipment(
          normalizedShipment
        );
      } catch (err) {
        console.log(
          "Dashboard loading error:",
          err
        );

        setError(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
  |--------------------------------------------------------------------------
  | GREETING
  |--------------------------------------------------------------------------
  */

  const greeting =
    useMemo(() => {
      const hour =
        new Date().getHours();

      if (hour < 12) {
        return "Good Morning";
      }

      if (hour < 17) {
        return "Good Afternoon";
      }

      return "Good Evening";
    }, []);

  /*
  |--------------------------------------------------------------------------
  | QUICK ACTIONS
  |--------------------------------------------------------------------------
  */

  const actions = [
    {
      route: "Scan",
      icon: "qr-code-outline",
      label: "Scan QR",
      subtitle: "Trace shipment",
    },

    {
      route: "Shipments",
      icon: "cube-outline",
      label: "Shipments",
      subtitle: "View all",
    },

    {
      route: "Devices",
      icon:
        "hardware-chip-outline",
      label: "Devices",
      subtitle: "Node status",
    },

    {
      route: "Alerts",
      icon: "warning-outline",
      label: "Alerts",
      subtitle: "View issues",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <Loader text="Loading dashboard..." />
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDashboard();
          }}
          tintColor={
            COLORS.green
          }
          colors={[
            COLORS.green,
          ]}
        />
      }
    >
      {/* ================================================================
          TOP APP BAR
      ================================================================= */}

      <LinearGradient
        colors={[
          COLORS.green,
          COLORS.emerald,
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.topBar}
      >
        <View
          style={styles.brandWrap}
        >
          <View
            style={styles.brandIcon}
          >
            <Ionicons
              name="leaf"
              size={21}
              color={
                COLORS.white
              }
            />
          </View>

          <View>
            <Text
              style={
                styles.brandName
              }
            >
              AgriTrace
            </Text>

            <Text
              style={
                styles.brandTagline
              }
            >
              Farm-to-Fork
              Traceability
            </Text>
          </View>
        </View>

        <View
          style={styles.topActions}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={
              styles.topIconButton
            }
            onPress={() =>
              navigation.navigate(
                "Alerts"
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={
                COLORS.white
              }
            />

            {(summary?.openAlerts ??
              0) > 0 && (
              <View
                style={
                  styles.topAlertBadge
                }
              >
                <Text
                  style={
                    styles.topAlertText
                  }
                >
                  {summary.openAlerts >
                  9
                    ? "9+"
                    : summary.openAlerts}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={
              styles.topAvatar
            }
            onPress={() =>
              navigation.navigate(
                "Profile"
              )
            }
          >
            <Text
              style={
                styles.topAvatarText
              }
            >
              {getInitials(
                profile?.name ||
                  profile?.email
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ================================================================
          WELCOME
      ================================================================= */}

      <View
        style={
          styles.welcomeSection
        }
      >
        <Text
          style={styles.greeting}
        >
          {greeting}
        </Text>

        <Text
          style={styles.userName}
          numberOfLines={1}
        >
          {profile?.name ||
            profile?.email
              ?.split("@")[0] ||
            "AgriTrace User"}
        </Text>

        <View
          style={styles.rolePill}
        >
          <View
            style={
              styles.onlineDot
            }
          />

          <Text
            style={
              styles.rolePillText
            }
          >
            {formatRole(
              profile?.role
            )}
          </Text>
        </View>
      </View>

      {/* ================================================================
          ERROR
      ================================================================= */}

      {error && (
        <View
          style={styles.errorBox}
        >
          <Ionicons
            name="warning-outline"
            size={18}
            color={
              COLORS.critical
            }
          />

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to refresh
              dashboard
            </Text>

            <Text
              style={styles.error}
            >
              {error.message ||
                "Something went wrong while loading dashboard data."}
            </Text>
          </View>

          <TouchableOpacity
            onPress={
              loadDashboard
            }
          >
            <Ionicons
              name="refresh"
              size={19}
              color={
                COLORS.critical
              }
            />
          </TouchableOpacity>
        </View>
      )}

      {/* ================================================================
          OVERVIEW METRICS
      ================================================================= */}

      <View
        style={
          styles.sectionHeader
        }
      >
        <Text
          style={
            styles.sectionHeading
          }
        >
          Overview
        </Text>

        <View
          style={
            styles.liveIndicator
          }
        >
          <View
            style={
              styles.liveDot
            }
          />

          <Text
            style={
              styles.sectionHint
            }
          >
            Live operations
          </Text>
        </View>
      </View>

      <View
        style={
          styles.metricGrid
        }
      >
        <MetricCard
          value={
            summary?.activeShipments ??
            0
          }
          label="Active"
          sublabel="Shipments"
          icon="cube-outline"
          iconBackground="#E7F6EF"
          iconColor={
            COLORS.green
          }
        />

        <MetricCard
          value={
            summary?.completedShipments ??
            0
          }
          label="Completed"
          sublabel="Shipments"
          icon="checkmark-circle-outline"
          iconBackground="#EAF3FF"
          iconColor={
            COLORS.blue
          }
        />

        <MetricCard
          value={
            summary?.openAlerts ??
            0
          }
          label="Open"
          sublabel="Alerts"
          icon="warning-outline"
          iconBackground="#FFF3E4"
          iconColor="#E5902C"
        />

        <MetricCard
          value={
            summary?.onlineDevices ??
            0
          }
          label="Online"
          sublabel="Devices"
          icon="hardware-chip-outline"
          iconBackground="#F0ECFF"
          iconColor="#7258C7"
        />
      </View>

      {/* ================================================================
          CURRENT SHIPMENT
      ================================================================= */}

      <SectionTitle
        title="Current Shipment"
        action="View all"
        onAction={() =>
          navigation.navigate(
            "Shipments"
          )
        }
      />

      {shipment ? (
        <View
          style={
            styles.shipmentCard
          }
        >
          {/* Shipment heading */}

          <View
            style={
              styles.rowBetween
            }
          >
            <View
              style={{ flex: 1 }}
            >
              <Text
                style={
                  styles.shipIdLabel
                }
              >
                SHIPMENT
              </Text>

              <Text
                style={styles.shipId}
                numberOfLines={1}
              >
                {shipment.id}
              </Text>
            </View>

            <ShipmentStatus
              status={
                shipment.status
              }
            />
          </View>

          {/* Product */}

          <View
            style={
              styles.productRow
            }
          >
            <View
              style={
                styles.productIcon
              }
            >
              <Ionicons
                name="leaf-outline"
                size={20}
                color={
                  COLORS.green
                }
              />
            </View>

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={
                  styles.product
                }
              >
                {shipment.product}
              </Text>

              <Text
                style={
                  styles.productCaption
                }
              >
                Farm-to-fork
                shipment
              </Text>
            </View>
          </View>

          {/* Route */}

          <View
            style={styles.routeBox}
          >
            <View
              style={styles.routePoint}
            >
              <View
                style={
                  styles.routeIconWrap
                }
              >
                <Ionicons
                  name="location-outline"
                  size={15}
                  color={
                    COLORS.green
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.routeCaption
                  }
                >
                  FROM
                </Text>

                <Text
                  style={
                    styles.routeText
                  }
                  numberOfLines={
                    1
                  }
                >
                  {shipment.source ||
                    "Origin"}
                </Text>
              </View>
            </View>

            <Ionicons
              name="arrow-forward"
              size={17}
              color={COLORS.muted}
            />

            <View
              style={styles.routePoint}
            >
              <View
                style={[
                  styles.routeIconWrap,
                  styles.routeIconBlue,
                ]}
              >
                <Ionicons
                  name="navigate-outline"
                  size={15}
                  color={
                    COLORS.blue
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.routeCaption
                  }
                >
                  TO
                </Text>

                <Text
                  style={
                    styles.routeText
                  }
                  numberOfLines={
                    1
                  }
                >
                  {shipment.destination ||
                    "Destination"}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress */}

          <View
            style={
              styles.progressHeader
            }
          >
            <Text
              style={
                styles.progressLabel
              }
            >
              Shipment Progress
            </Text>

            <Text
              style={
                styles.progressText
              }
            >
              {shipment.progress ??
                0}
              %
            </Text>
          </View>

          <View
            style={
              styles.progressTrack
            }
          >
            <LinearGradient
              colors={[
                COLORS.green,
                COLORS.blue,
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 0,
              }}
              style={[
                styles.progressFill,
                {
                  width: `${
                    shipment.progress ??
                    0
                  }%`,
                },
              ]}
            />
          </View>

          {/* Telemetry */}

          <Text
            style={
              styles.sensorHeading
            }
          >
            Live Conditions
          </Text>

          <View
            style={styles.envGrid}
          >
            <Env
              icon="thermometer"
              value={formatValue(
                shipment.temperature,
                "°C",
                1
              )}
              label="Temp"
              iconColor="#E46E5D"
              iconBackground="#FFF0ED"
            />

            <Env
              icon="water-percent"
              value={formatValue(
                shipment.humidity,
                "%",
                0
              )}
              label="Humidity"
              iconColor={
                COLORS.blue
              }
              iconBackground="#EAF4FF"
            />

            <Env
              icon="weather-windy"
              value={
                shipment.gasStatus ||
                "—"
              }
              label="Gas"
              iconColor="#7063C8"
              iconBackground="#F0EEFF"
            />

            <Env
              icon="battery-high"
              value={formatValue(
                shipment.battery,
                "%",
                0
              )}
              label="Battery"
              iconColor={
                COLORS.green
              }
              iconBackground="#E8F7EF"
            />
          </View>

          {/* Button */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate(
                "ShipmentDetails",
                {
                  shipmentId:
                    shipment.id,
                }
              )
            }
          >
            <LinearGradient
              colors={[
                COLORS.green,
                COLORS.emerald,
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 0,
              }}
              style={
                styles.fullButton
              }
            >
              <Text
                style={
                  styles.fullButtonText
                }
              >
                View Shipment
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color={
                  COLORS.white
                }
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <EmptyState
          title="No shipments yet"
          message="Create or assign a shipment to see it here."
        />
      )}

      {/* ================================================================
          QUICK ACTIONS
      ================================================================= */}

      <SectionTitle
        title="Quick Actions"
      />

      <View
        style={styles.quickGrid}
      >
        {actions.map(
          ({
            route,
            icon,
            label,
            subtitle,
          }) => (
            <TouchableOpacity
              key={label}
              activeOpacity={0.8}
              style={styles.quick}
              onPress={() =>
                navigation.navigate(
                  route
                )
              }
            >
              <View
                style={
                  styles.quickIcon
                }
              >
                <Ionicons
                  name={icon}
                  size={20}
                  color={
                    COLORS.green
                  }
                />
              </View>

              <Text
                style={
                  styles.quickText
                }
              >
                {label}
              </Text>

              <Text
                style={
                  styles.quickSubtext
                }
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* ================================================================
          LIVE OVERVIEW
      ================================================================= */}

      <SectionTitle
        title="Network Health"
      />

      <View
        style={styles.overview}
      >
        <Overview
          icon="thermometer-outline"
          label="Avg Temperature"
          value={formatValue(
            summary?.averageTemperature,
            "°C",
            1
          )}
        />

        <Overview
          icon="water-outline"
          label="Avg Humidity"
          value={formatValue(
            summary?.averageHumidity,
            "%",
            0
          )}
        />

        <Overview
          icon="alert-circle-outline"
          label="Critical Alerts"
          value={
            summary?.criticalAlerts ??
            0
          }
        />

        <Overview
          icon="cloud-offline-outline"
          label="Offline Devices"
          value={
            summary?.offlineDevices ??
            0
          }
        />
      </View>

      {/* ================================================================
          RECENT ACTIVITY
      ================================================================= */}

      {summary?.recentShipments
        ?.length > 0 && (
        <>
          <SectionTitle
            title="Recent Activity"
            action="Shipments"
            onAction={() =>
              navigation.navigate(
                "Shipments"
              )
            }
          />

          <View
            style={
              styles.activityContainer
            }
          >
            {summary.recentShipments
              .slice(0, 4)
              .map(
                (
                  item,
                  index
                ) => (
                  <TouchableOpacity
                    activeOpacity={
                      0.8
                    }
                    key={
                      item.shipmentId ||
                      index
                    }
                    style={
                      styles.activity
                    }
                    onPress={() =>
                      navigation.navigate(
                        "ShipmentDetails",
                        {
                          shipmentId:
                            item.shipmentId,
                        }
                      )
                    }
                  >
                    <View
                      style={
                        styles.activityIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="truck-outline"
                        size={17}
                        color={
                          COLORS.forest
                        }
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.activityText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {item.product ||
                          item.productName ||
                          "Shipment"}
                      </Text>

                      <Text
                        style={
                          styles.activityId
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          item.shipmentId
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.activityRight
                      }
                    >
                      <Text
                        style={
                          styles.activityTime
                        }
                      >
                        {formatStatus(
                          item.status
                        )}
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={
                          COLORS.muted
                        }
                      />
                    </View>
                  </TouchableOpacity>
                )
              )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTS
|--------------------------------------------------------------------------
*/

function SectionTitle({
  title,
  action,
  onAction,
}) {
  return (
    <View
      style={styles.sectionTitleRow}
    >
      <Text
        style={styles.sectionTitle}
      >
        {title}
      </Text>

      <View
        style={styles.sectionLine}
      />

      {action && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text
            style={
              styles.sectionAction
            }
          >
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MetricCard({
  value,
  label,
  sublabel,
  icon,
  iconBackground,
  iconColor,
}) {
  return (
    <View
      style={styles.metricCard}
    >
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={iconColor}
        />
      </View>

      <Text
        style={styles.metricValue}
      >
        {value}
      </Text>

      <Text
        style={styles.metricLabel}
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricSublabel
        }
      >
        {sublabel}
      </Text>
    </View>
  );
}

function Env({
  icon,
  value,
  label,
  iconColor = COLORS.blue,
  iconBackground =
    COLORS.backgroundBlue,
}) {
  return (
    <View style={styles.env}>
      <View
        style={[
          styles.envIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={iconColor}
        />
      </View>

      <Text
        style={styles.envValue}
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text
        style={styles.envLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function Overview({
  label,
  value,
  icon,
}) {
  return (
    <View
      style={
        styles.overviewItem
      }
    >
      <View
        style={
          styles.overviewIcon
        }
      >
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.green}
        />
      </View>

      <View
        style={{ flex: 1 }}
      >
        <Text
          style={
            styles.overviewValue
          }
        >
          {value}
        </Text>

        <Text
          style={
            styles.overviewLabel
          }
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getInitials(
  value = ""
) {
  return (
    value
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word[0]?.toUpperCase()
      )
      .join("") || "AT"
  );
}

function formatRole(role) {
  const roles = {
    ADMIN:
      "Operations Manager",

    FARMER: "Farmer",

    TRANSPORTER:
      "Transporter",

    WAREHOUSE:
      "Warehouse Manager",

    RETAILER: "Retailer",
  };

  return (
    roles[role] ||
    role ||
    "User"
  );
}

function formatValue(
  value,
  suffix = "",
  decimals = 0
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${Number(
    value
  ).toFixed(decimals)}${suffix}`;
}

function formatStatus(status) {
  if (!status) {
    return "Updated";
  }

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | Screen
    |--------------------------------------------------------------------------
    */

    screen: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 115,
    },

    /*
    |--------------------------------------------------------------------------
    | Top bar
    |--------------------------------------------------------------------------
    */

    topBar: {
      marginHorizontal: -18,
      marginTop: -18,

      paddingTop: 21,
      paddingBottom: 18,
      paddingHorizontal: 20,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },

    brandWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    brandIcon: {
      width: 42,
      height: 42,

      borderRadius: 13,

      backgroundColor:
        "rgba(255,255,255,0.16)",

      alignItems: "center",
      justifyContent: "center",
    },

    brandName: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 19,

      color: COLORS.white,
    },

    brandTagline: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 9,

      color:
        "rgba(255,255,255,0.76)",

      marginTop: 1,
    },

    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    topIconButton: {
      width: 40,
      height: 40,

      borderRadius: 13,

      backgroundColor:
        "rgba(255,255,255,0.14)",

      alignItems: "center",
      justifyContent: "center",
    },

    topAlertBadge: {
      position: "absolute",

      top: -4,
      right: -4,

      minWidth: 18,
      height: 18,

      paddingHorizontal: 4,

      borderRadius: 9,

      backgroundColor:
        "#E5484D",

      borderWidth: 2,

      borderColor:
        COLORS.green,

      alignItems: "center",
      justifyContent: "center",
    },

    topAlertText: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 8,

      color: COLORS.white,
    },

    topAvatar: {
      width: 41,
      height: 41,

      borderRadius: 13,

      backgroundColor:
        COLORS.white,

      alignItems: "center",
      justifyContent: "center",
    },

    topAvatarText: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 12,

      color: COLORS.green,
    },

    /*
    |--------------------------------------------------------------------------
    | Welcome
    |--------------------------------------------------------------------------
    */

    welcomeSection: {
      paddingTop: 21,
      paddingBottom: 20,
    },

    greeting: {
      fontFamily:
        "Inter_500Medium",

      fontSize: 12,

      color: COLORS.muted,
    },

    userName: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 23,

      color: COLORS.text,

      marginTop: 2,
    },

    rolePill: {
      alignSelf: "flex-start",

      flexDirection: "row",
      alignItems: "center",

      gap: 6,

      marginTop: 8,

      paddingHorizontal: 11,
      paddingVertical: 5,

      borderRadius: 20,

      backgroundColor:
        COLORS.greenLight,
    },

    onlineDot: {
      width: 6,
      height: 6,

      borderRadius: 3,

      backgroundColor:
        COLORS.green,
    },

    rolePillText: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 10.5,

      color: COLORS.forest,
    },

    /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

    errorBox: {
      flexDirection: "row",

      alignItems: "center",

      gap: 10,

      padding: 12,

      backgroundColor:
        COLORS.criticalLight,

      borderRadius: 13,

      marginBottom: 18,

      borderWidth: 1,

      borderColor:
        "rgba(225,70,70,0.15)",
    },

    errorTitle: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 11.5,

      color: COLORS.critical,
    },

    error: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 10,

      lineHeight: 14,

      color: COLORS.critical,

      marginTop: 2,
    },

    /*
    |--------------------------------------------------------------------------
    | Overview Heading
    |--------------------------------------------------------------------------
    */

    sectionHeader: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems: "center",

      marginBottom: 11,
    },

    sectionHeading: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 15,

      color: COLORS.text,
    },

    liveIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    liveDot: {
      width: 6,
      height: 6,

      borderRadius: 3,

      backgroundColor:
        COLORS.green,
    },

    sectionHint: {
      fontFamily:
        "Inter_500Medium",

      fontSize: 9.5,

      color: COLORS.muted,
    },

    /*
    |--------------------------------------------------------------------------
    | Metric Cards
    |--------------------------------------------------------------------------
    */

    metricGrid: {
      flexDirection: "row",

      gap: 7,

      marginBottom: 25,
    },

    metricCard: {
      flex: 1,

      minHeight: 119,

      paddingHorizontal: 10,
      paddingVertical: 11,

      borderRadius: 15,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    metricIcon: {
      width: 32,
      height: 32,

      borderRadius: 10,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 8,
    },

    metricValue: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 21,

      color: COLORS.text,

      lineHeight: 24,
    },

    metricLabel: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 9.5,

      color: COLORS.text,

      marginTop: 2,
    },

    metricSublabel: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 8.5,

      color: COLORS.muted,

      marginTop: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | Section Titles
    |--------------------------------------------------------------------------
    */

    sectionTitleRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 10,

      marginTop: 4,

      marginBottom: 12,
    },

    sectionTitle: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 15,

      color: COLORS.text,
    },

    sectionLine: {
      flex: 1,

      height: 1,

      backgroundColor:
        COLORS.border,
    },

    sectionAction: {
      fontFamily:
        "Inter_600SemiBold",

      fontSize: 10,

      color: COLORS.green,
    },

    /*
    |--------------------------------------------------------------------------
    | Shipment Card
    |--------------------------------------------------------------------------
    */

    shipmentCard: {
      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 20,

      padding: 16,

      marginBottom: 25,
    },

    rowBetween: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems: "flex-start",

      gap: 10,
    },

    shipIdLabel: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 8,

      letterSpacing: 0.8,

      color: COLORS.muted,
    },

    shipId: {
      fontFamily:
        "Inter_600SemiBold",

      fontSize: 10.5,

      color: COLORS.muted,

      marginTop: 2,

      maxWidth: 215,
    },

    /*
    |--------------------------------------------------------------------------
    | Product
    |--------------------------------------------------------------------------
    */

    productRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 11,

      marginTop: 15,
    },

    productIcon: {
      width: 42,
      height: 42,

      borderRadius: 13,

      backgroundColor:
        COLORS.greenLight,

      alignItems: "center",
      justifyContent: "center",
    },

    product: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 17,

      color: COLORS.text,
    },

    productCaption: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 9.5,

      color: COLORS.muted,

      marginTop: 2,
    },

    /*
    |--------------------------------------------------------------------------
    | Route
    |--------------------------------------------------------------------------
    */

    routeBox: {
      flexDirection: "row",

      alignItems: "center",

      gap: 8,

      marginTop: 16,

      padding: 11,

      backgroundColor:
        COLORS.backgroundBlue,

      borderRadius: 13,
    },

    routePoint: {
      flex: 1,

      flexDirection: "row",

      alignItems: "center",

      gap: 7,
    },

    routeIconWrap: {
      width: 30,
      height: 30,

      borderRadius: 9,

      backgroundColor:
        COLORS.greenLight,

      alignItems: "center",
      justifyContent: "center",
    },

    routeIconBlue: {
      backgroundColor:
        "#E8F2FD",
    },

    routeCaption: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 7.5,

      letterSpacing: 0.5,

      color: COLORS.muted,
    },

    routeText: {
      fontFamily:
        "Inter_600SemiBold",

      fontSize: 10,

      color: COLORS.text,

      marginTop: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | Progress
    |--------------------------------------------------------------------------
    */

    progressHeader: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems: "center",

      marginTop: 16,

      marginBottom: 7,
    },

    progressLabel: {
      fontFamily:
        "Inter_600SemiBold",

      fontSize: 10,

      color: COLORS.muted,
    },

    progressText: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 11,

      color: COLORS.text,
    },

    progressTrack: {
      height: 7,

      backgroundColor:
        COLORS.border,

      borderRadius: 8,

      overflow: "hidden",
    },

    progressFill: {
      height: "100%",

      borderRadius: 8,
    },

    /*
    |--------------------------------------------------------------------------
    | Sensors
    |--------------------------------------------------------------------------
    */

    sensorHeading: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 10,

      color: COLORS.muted,

      marginTop: 16,

      marginBottom: 9,
    },

    envGrid: {
      flexDirection: "row",

      gap: 7,

      marginBottom: 15,
    },

    env: {
      flex: 1,

      minHeight: 88,

      paddingVertical: 9,
      paddingHorizontal: 3,

      borderRadius: 12,

      backgroundColor:
        COLORS.backgroundBlue,

      alignItems: "center",

      justifyContent:
        "center",
    },

    envIcon: {
      width: 28,
      height: 28,

      borderRadius: 9,

      alignItems: "center",

      justifyContent: "center",

      marginBottom: 5,
    },

    envValue: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 10.5,

      color: COLORS.text,
    },

    envLabel: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 8.5,

      color: COLORS.muted,

      marginTop: 2,
    },

    /*
    |--------------------------------------------------------------------------
    | Shipment Button
    |--------------------------------------------------------------------------
    */

    fullButton: {
      minHeight: 47,

      borderRadius: 13,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: 8,
    },

    fullButtonText: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 12.5,

      color: COLORS.white,
    },

    /*
    |--------------------------------------------------------------------------
    | Quick Actions
    |--------------------------------------------------------------------------
    */

    quickGrid: {
      flexDirection: "row",

      gap: 8,

      marginBottom: 26,
    },

    quick: {
      flex: 1,

      minHeight: 104,

      paddingVertical: 12,
      paddingHorizontal: 4,

      borderRadius: 15,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems: "center",

      justifyContent: "center",
    },

    quickIcon: {
      width: 36,
      height: 36,

      borderRadius: 11,

      backgroundColor:
        COLORS.greenLight,

      alignItems: "center",

      justifyContent: "center",

      marginBottom: 7,
    },

    quickText: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 9.5,

      color: COLORS.text,

      textAlign: "center",
    },

    quickSubtext: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 7.5,

      color: COLORS.muted,

      textAlign: "center",

      marginTop: 2,
    },

    /*
    |--------------------------------------------------------------------------
    | Network Overview
    |--------------------------------------------------------------------------
    */

    overview: {
      flexDirection: "row",

      flexWrap: "wrap",

      columnGap: "4%",

      rowGap: 9,

      marginBottom: 26,
    },

    overviewItem: {
      width: "48%",

      minHeight: 78,

      flexDirection: "row",

      alignItems: "center",

      gap: 10,

      padding: 12,

      borderRadius: 14,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    overviewIcon: {
      width: 35,
      height: 35,

      borderRadius: 11,

      backgroundColor:
        COLORS.greenLight,

      alignItems: "center",

      justifyContent: "center",
    },

    overviewValue: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 16,

      color: COLORS.text,
    },

    overviewLabel: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 8.5,

      color: COLORS.muted,

      marginTop: 2,

      lineHeight: 12,
    },

    /*
    |--------------------------------------------------------------------------
    | Recent Activity
    |--------------------------------------------------------------------------
    */

    activityContainer: {
      borderRadius: 16,

      overflow: "hidden",

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,
    },

    activity: {
      flexDirection: "row",

      alignItems: "center",

      gap: 11,

      paddingHorizontal: 13,
      paddingVertical: 12,

      borderBottomWidth: 1,

      borderBottomColor:
        COLORS.border,
    },

    activityIcon: {
      width: 35,
      height: 35,

      borderRadius: 11,

      backgroundColor:
        COLORS.greenLight,

      alignItems: "center",

      justifyContent: "center",
    },

    activityText: {
      fontFamily:
        "Inter_600SemiBold",

      fontSize: 11,

      color: COLORS.text,
    },

    activityId: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 8.5,

      color: COLORS.muted,

      marginTop: 2,
    },

    activityRight: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      maxWidth: 100,
    },

    activityTime: {
      fontFamily:
        "Inter_500Medium",

      fontSize: 8,

      color: COLORS.muted,

      textAlign: "right",
    },
  });