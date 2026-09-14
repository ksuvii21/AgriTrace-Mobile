import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import TopBar from "../../components/common/TopBar";
import SensorCard from "../../components/device/SensorCard";
import Loader from "../../components/common/Loader";
import { getShipment } from "../../api/shipmentApi";
import { getLatestTelemetryByShipment } from "../../api/telemetryApi";
import { normalizeShipment } from "../../utils/apiMappers";
import { statusLabel, isTempWarning, isHumidityWarning } from "../../utils/statusUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function ShipmentDetailsScreen({navigation,route}) {
  const {t}=useLanguage();
  const shipmentId=route.params?.shipmentId;
  const [s,setS]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  useEffect(()=>{(async()=>{try{const raw=await getShipment(shipmentId);let telemetry=null;try{telemetry=await getLatestTelemetryByShipment(shipmentId)}catch{}setS(normalizeShipment(raw,telemetry))}catch(e){setError(e)}finally{setLoading(false)}})()},[shipmentId]);
  if(loading)return <Loader text={t("shipment_details_loading")}/>;
  if(error||!s)return <View style={styles.center}><Text style={styles.err}>{error?.message||t("shipment_details_not_found")}</Text><TouchableOpacity onPress={()=>navigation.goBack()}><Text style={styles.link}>{t("shipment_details_go_back")}</Text></TouchableOpacity></View>;

  const tempWarn=s.temperature!=null&&isTempWarning(s.temperature), humWarn=s.humidity!=null&&isHumidityWarning(s.humidity), gasWarn=s.gasStatus==="Warning";
  const stepNames=[t("shipment_step_created"),t("shipment_step_device"),t("shipment_step_ready"),t("shipment_step_transit"),t("shipment_step_warehouse"),t("shipment_step_delivered")];
  const index={PENDING:0,DEVICE_ASSIGNED:1,READY_FOR_DISPATCH:2,IN_TRANSIT:3,AT_WAREHOUSE:4,DELIVERED:5,CANCELLED:0}[s.status]??0;

  return <View style={styles.screen}><TopBar title={s.id} navigation={navigation} rightIcon="ellipsis-horizontal"/><ScrollView contentContainerStyle={styles.content}>
    <LinearGradient colors={[COLORS.green,COLORS.blue]} style={styles.hero}><Text style={styles.heroId}>{s.id}</Text><Text style={styles.heroTitle}>{s.product}</Text><Text style={styles.heroBadge}>{statusLabel(s.status)}</Text><Text style={styles.qty}>{t("shipment_details_quantity")}: {s.quantity}</Text></LinearGradient>
    <View style={styles.route}><Ionicons name="location" size={18} color={COLORS.muted}/><Text style={styles.routeText}>{s.source}</Text><Ionicons name="arrow-forward" size={14} color={COLORS.muted}/><Text style={styles.routeText}>{s.destination}</Text></View>
    <View style={styles.steps}>{stepNames.map((name,i)=><View key={name} style={styles.step}><View style={[styles.dot,i<index&&{backgroundColor:COLORS.emerald},i===index&&{backgroundColor:COLORS.blue}]}>{i<index?<Ionicons name="checkmark" size={11} color={COLORS.white}/>:null}</View><Text style={styles.stepLabel}>{name}</Text></View>)}</View>
    <View style={styles.sensorGrid}><SensorCard icon="thermometer" value={s.temperature==null?"—":`${s.temperature}°C`} label={t("sensor_temperature")} status={tempWarn?t("sensor_status_warning"):t("sensor_status_safe")} warning={tempWarn}/><SensorCard icon="water-percent" value={s.humidity==null?"—":`${s.humidity}%`} label={t("sensor_humidity")} status={humWarn?t("sensor_status_warning"):t("sensor_status_safe")} warning={humWarn}/><SensorCard icon="weather-windy" value={s.gasStatus} label={t("sensor_gas")} status={gasWarn?t("sensor_status_warning"):t("sensor_status_safe")} warning={gasWarn}/><SensorCard icon="battery-high" value={s.battery==null?"—":`${s.battery}%`} label={t("sensor_battery")} status={t("sensor_status_good")}/></View>
    <View style={styles.sync}><View><Text style={styles.small}>{t("shipment_sync_device")}</Text><Text style={styles.strong}>{s.device||t("shipment_sync_not_assigned")}</Text></View><View style={{alignItems:"flex-end"}}><Text style={styles.small}>{t("shipment_sync_tracking_id")}</Text><Text style={styles.strong}>{s.trackingId||"—"}</Text></View></View>
    <View style={styles.actions}><Action icon="pulse-outline" text={t("action_live_monitoring")} onPress={()=>navigation.navigate("LiveMonitoring",{shipmentId:s.id})}/><Action icon="git-branch-outline" text={t("action_view_traceability")} onPress={()=>navigation.navigate("Traceability",{shipmentId:s.id})}/><Action icon="qr-code-outline" text={t("action_shipment_qr")} onPress={()=>navigation.navigate("ShipmentQr",{shipmentId:s.id})}/><Action icon="flag-outline" text={t("action_report_problem")} onPress={()=>Alert.alert(t("report_problem_title"),t("report_problem_body"))}/></View>
  </ScrollView></View>
}
function Action({icon,text,onPress}){return <TouchableOpacity style={styles.action} onPress={onPress}><Ionicons name={icon} size={18} color={COLORS.green}/><Text style={styles.actionText}>{text}</Text></TouchableOpacity>}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18,paddingBottom:35},center:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:COLORS.background,padding:30},err:{fontFamily:"Inter_600SemiBold",color:COLORS.critical,textAlign:"center"},link:{fontFamily:"Inter_700Bold",color:COLORS.blue,marginTop:12},
  hero:{borderRadius:20,padding:18,marginBottom:18},heroId:{fontFamily:"Inter_500Medium",fontSize:12,color:"rgba(255,255,255,.85)"},heroTitle:{fontFamily:"Manrope_800ExtraBold",fontSize:20,color:COLORS.white,marginTop:4},heroBadge:{alignSelf:"flex-start",fontFamily:"Inter_700Bold",fontSize:10.5,color:COLORS.white,backgroundColor:"rgba(255,255,255,.18)",paddingHorizontal:12,paddingVertical:5,borderRadius:99,marginTop:9},qty:{fontFamily:"Inter_500Medium",fontSize:12.5,color:"rgba(255,255,255,.9)",marginTop:12},
  route:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:15,marginBottom:18},routeText:{fontFamily:"Inter_500Medium",fontSize:12.5,color:COLORS.text},
  steps:{flexDirection:"row",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,paddingVertical:18,paddingHorizontal:5,marginBottom:18},step:{flex:1,alignItems:"center"},dot:{width:24,height:24,borderRadius:12,backgroundColor:COLORS.border,alignItems:"center",justifyContent:"center"},stepLabel:{fontFamily:"Inter_500Medium",fontSize:7.8,color:COLORS.muted,textAlign:"center",marginTop:6},
  sensorGrid:{flexDirection:"row",flexWrap:"wrap",gap:"4%",rowGap:12,marginBottom:18},sync:{flexDirection:"row",justifyContent:"space-between",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:15,marginBottom:18},small:{fontFamily:"Inter_400Regular",fontSize:11,color:COLORS.muted},strong:{fontFamily:"Inter_700Bold",fontSize:12.5,color:COLORS.text,marginTop:2},
  actions:{flexDirection:"row",flexWrap:"wrap",gap:"4%",rowGap:10},action:{width:"48%",flexDirection:"row",alignItems:"center",gap:8,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:12},actionText:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.text}
});