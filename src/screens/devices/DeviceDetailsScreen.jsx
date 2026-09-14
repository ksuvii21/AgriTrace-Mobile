import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import COLORS from "../../constants/colors";
import TopBar from "../../components/common/TopBar";
import Loader from "../../components/common/Loader";
import { getDevice, getDeviceHealth } from "../../api/deviceApi";
import { normalizeDevice } from "../../utils/apiMappers";
import { deviceStatusColor } from "../../utils/statusUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function DeviceDetailsScreen({navigation,route}) {
  const {t}=useLanguage();
  const id=route.params?.deviceId;const [d,setD]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null);
  useEffect(()=>{(async()=>{try{const [raw,health]=await Promise.all([getDevice(id),getDeviceHealth(id)]);setD(normalizeDevice(raw,health))}catch(e){setError(e)}finally{setLoading(false)}})()},[id]);
  if(loading)return <Loader text={t("device_details_loading")}/>;if(error||!d)return <View style={styles.center}><Text style={styles.err}>{error?.message||t("device_details_not_found")}</Text></View>;
  const color=deviceStatusColor(d.status);
  return <View style={styles.screen}><TopBar title={t("device_details_title")} navigation={navigation}/><ScrollView contentContainerStyle={styles.content}><View style={styles.hero}><View style={[styles.dot,{backgroundColor:color}]}/><Text style={styles.id}>{d.id}</Text><Text style={[styles.status,{color}]}>{d.status}</Text></View><Info label={t("device_info_shipment")} value={d.shipment||t("device_unassigned")}/><Info label={t("device_info_battery")} value={d.battery==null?"—":`${d.battery}%`}/><Info label={t("device_info_last_seen")} value={formatDate(d.lastSeen)}/><Info label={t("device_info_temp")} value={d.temp==null?"—":`${d.temp}°C`}/><Info label={t("device_info_firmware")} value={d.firmwareVersion||"—"}/><TouchableOpacity style={styles.button} onPress={()=>navigation.navigate("AssignDevice",{deviceId:d.id})}><Text style={styles.buttonText}>{t("device_assign_button")}</Text></TouchableOpacity></ScrollView></View>
}
const formatDate=v=>v?new Date(v).toLocaleString():"—";function Info({label,value}){return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18},center:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:COLORS.background},err:{color:COLORS.critical,fontFamily:"Inter_600SemiBold"},hero:{alignItems:"center",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:18,padding:24,marginBottom:14},dot:{width:16,height:16,borderRadius:8,marginBottom:10},id:{fontFamily:"Manrope_800ExtraBold",fontSize:18,color:COLORS.text},status:{fontFamily:"Inter_700Bold",fontSize:12,marginTop:5},info:{flexDirection:"row",justifyContent:"space-between",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:15,marginBottom:10},label:{fontFamily:"Inter_500Medium",fontSize:12,color:COLORS.muted},value:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.text,maxWidth:"58%",textAlign:"right"},button:{backgroundColor:COLORS.green,borderRadius:12,paddingVertical:14,alignItems:"center",marginTop:6},buttonText:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.white}})
