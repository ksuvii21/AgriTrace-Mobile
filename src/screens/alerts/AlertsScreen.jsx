import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import COLORS from "../../constants/colors";
import AlertCard from "../../components/alerts/AlertCard";
import Loader from "../../components/common/Loader";
import { getAlerts, acknowledgeAlert } from "../../api/alertApi";
import { normalizeAlert } from "../../utils/apiMappers";
import { useAuth } from "../../hooks/useAuth";

export default function AlertsScreen({navigation}) {
  const {role}=useAuth();const [filter,setFilter]=useState("all"),[alerts,setAlerts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null);
  const load=useCallback(async()=>{try{setError(null);const result=await getAlerts({page:1,limit:100});setAlerts((result?.alerts||[]).map(normalizeAlert))}catch(e){setError(e)}finally{setLoading(false)}},[]);
  useEffect(()=>{load()},[load]);
  const list=useMemo(()=>filter==="Resolved"?alerts.filter(a=>a.resolved):filter==="all"?alerts:alerts.filter(a=>a.severity===filter&&!a.resolved),[alerts,filter]);
  if(loading)return <Loader text="Loading alerts..."/>;
  const view=a=>{if(a.raw?.shipmentId)navigation.navigate("ShipmentDetails",{shipmentId:a.raw.shipmentId});else if(a.raw?.deviceId)navigation.navigate("DeviceDetails",{deviceId:a.raw.deviceId})};
  const ack=async a=>{if(role!=="ADMIN"){Alert.alert("Admin action","Your backend currently allows only ADMIN users to acknowledge alerts.");return}try{await acknowledgeAlert(a.id);await load()}catch(e){Alert.alert("Unable to acknowledge",e.message)}};
  return <View style={styles.screen}><View style={styles.top}><Text style={styles.title}>Alerts</Text></View><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={load}/>}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{["all","Critical","Warning","Device","Resolved"].map(t=><TouchableOpacity key={t} onPress={()=>setFilter(t)} style={[styles.tab,filter===t&&styles.active]}><Text style={[styles.tabText,filter===t&&styles.activeText]}>{t==="all"?"All":t}</Text></TouchableOpacity>)}</ScrollView>{error?<Text style={styles.err}>{error.message}</Text>:null}{list.map(a=><AlertCard key={a.id} alert={a} onView={()=>view(a)} onAcknowledge={()=>ack(a)}/>)}</ScrollView></View>
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},top:{height:58,justifyContent:"center",paddingHorizontal:18,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border},title:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},content:{padding:18,paddingBottom:105},tabs:{gap:8,marginBottom:16},tab:{paddingHorizontal:16,paddingVertical:9,borderRadius:99,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border},active:{backgroundColor:COLORS.green,borderColor:COLORS.green},tabText:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.muted},activeText:{color:COLORS.white},err:{fontFamily:"Inter_500Medium",fontSize:12,color:COLORS.critical,marginBottom:10}})
