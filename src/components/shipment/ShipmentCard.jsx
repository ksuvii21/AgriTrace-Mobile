import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import ShipmentStatus from "./ShipmentStatus";
import { useLanguage } from "../../context/LanguageContext";

export default function ShipmentCard({ shipment, onPress }) {
  const { t } = useLanguage();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{flex:1}}>
          <Text style={styles.id}>{shipment.id}</Text>
          <Text style={styles.product}>{shipment.product}</Text>
        </View>
        <ShipmentStatus status={shipment.status} />
      </View>

      <View style={styles.route}>
        <Ionicons name="location-outline" size={15} color={COLORS.muted}/>
        <Text style={styles.routeText}>{shipment.source}</Text>
        <Ionicons name="arrow-forward" size={14} color={COLORS.muted}/>
        <Text style={styles.routeText}>{shipment.destination}</Text>
      </View>

      <View style={styles.meta}>
        <Meta label={t("shipment_meta_temperature")} value={`${shipment.temperature}°C`} />
        <Meta label={shipment.status === "DELIVERED" ? t("shipment_meta_delivered") : t("shipment_meta_eta")} value={shipment.eta} />
        <Meta label={t("shipment_meta_device")} value={shipment.device || "—"} />
      </View>

      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{t("shipment_view_details")}</Text>
        <Ionicons name="chevron-forward" size={15} color={COLORS.green}/>
      </TouchableOpacity>
    </View>
  );
}

function Meta({label,value}) {
  return <View style={{flex:1}}><Text style={styles.metaLabel}>{label}</Text><Text numberOfLines={1} style={styles.metaValue}>{value}</Text></View>
}

const styles = StyleSheet.create({
  card:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:15,marginBottom:12},
  top:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",gap:10},
  id:{fontFamily:"Inter_700Bold",fontSize:11,color:COLORS.muted},
  product:{fontFamily:"Manrope_800ExtraBold",fontSize:15,color:COLORS.text,marginTop:2},
  route:{flexDirection:"row",alignItems:"center",gap:7,marginVertical:11},
  routeText:{fontFamily:"Inter_500Medium",fontSize:12.5,color:COLORS.text},
  meta:{flexDirection:"row",gap:10,marginBottom:12},
  metaLabel:{fontFamily:"Inter_400Regular",fontSize:10.5,color:COLORS.muted},
  metaValue:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.text,marginTop:2},
  button:{alignSelf:"flex-end",flexDirection:"row",alignItems:"center",gap:3,backgroundColor:COLORS.backgroundBlue,borderWidth:1,borderColor:COLORS.border,borderRadius:10,paddingHorizontal:12,paddingVertical:9},
  buttonText:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.text}
});