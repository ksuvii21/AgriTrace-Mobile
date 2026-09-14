import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import COLORS from "../../constants/colors";
import TopBar from "../../components/common/TopBar";
import Loader from "../../components/common/Loader";
import { getShipments } from "../../api/shipmentApi";
import { assignDevice } from "../../api/deviceApi";
import { normalizeShipment } from "../../utils/apiMappers";
import { useLanguage } from "../../context/LanguageContext";

export default function AssignDeviceScreen({navigation,route}) {
  const {t}=useLanguage();
  const deviceId=route.params?.deviceId;const [list,setList]=useState([]),[selected,setSelected]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  useEffect(()=>{getShipments().then(r=>setList((r||[]).map(normalizeShipment).filter(s=>s.category!=="completed"))).catch(e=>Alert.alert(t("assign_device_load_failed"),e.message)).finally(()=>setLoading(false))},[]);
  async function submit(){try{setSaving(true);await assignDevice(deviceId,selected);Alert.alert(t("assign_device_assigned_title"),`${deviceId} ${t("assign_device_assigned_to")} ${selected}.`,[{text:t("ok"),onPress:()=>navigation.goBack()}])}catch(e){Alert.alert(t("assign_device_failed_title"),e.message)}finally{setSaving(false)}}
  if(loading)return <Loader text={t("assign_device_loading")}/>;
  return <View style={styles.screen}><TopBar title={t("assign_device_title")} navigation={navigation}/><ScrollView contentContainerStyle={styles.content}><Text style={styles.lead}>{t("assign_device_lead_prefix")} <Text style={styles.bold}>{deviceId}</Text> {t("assign_device_lead_suffix")}</Text>{list.map(s=><TouchableOpacity key={s.id} onPress={()=>setSelected(s.id)} style={[styles.row,selected===s.id&&styles.selected]}><View style={{flex:1}}><Text style={styles.id}>{s.id}</Text><Text style={styles.sub}>{s.product} · {s.source} → {s.destination}</Text></View><View style={[styles.radio,selected===s.id&&styles.radioOn]}/></TouchableOpacity>)}<TouchableOpacity disabled={!selected||saving} style={[styles.button,(!selected||saving)&&{opacity:.45}]} onPress={submit}><Text style={styles.buttonText}>{saving?t("assign_device_assigning"):t("assign_device_confirm")}</Text></TouchableOpacity></ScrollView></View>
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18},lead:{fontFamily:"Inter_400Regular",fontSize:13,color:COLORS.muted,marginBottom:16},bold:{fontFamily:"Inter_700Bold",color:COLORS.text},row:{flexDirection:"row",alignItems:"center",gap:12,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:14,padding:15,marginBottom:10},selected:{borderColor:COLORS.green,backgroundColor:COLORS.greenLight},id:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.text},sub:{fontFamily:"Inter_400Regular",fontSize:11.5,color:COLORS.muted,marginTop:3},radio:{width:18,height:18,borderRadius:9,borderWidth:2,borderColor:COLORS.border},radioOn:{borderWidth:5,borderColor:COLORS.green,backgroundColor:COLORS.white},button:{backgroundColor:COLORS.green,borderRadius:12,paddingVertical:14,alignItems:"center",marginTop:8},buttonText:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.white}})