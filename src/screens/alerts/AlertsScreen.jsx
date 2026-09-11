import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import COLORS from "../../constants/colors";
import { alertsSeed, shipments } from "../../data/mockData";
import AlertCard from "../../components/alerts/AlertCard";

export default function AlertsScreen({navigation}) {
  const [filter,setFilter]=useState("all");
  const [alerts,setAlerts]=useState(alertsSeed);

  const list=useMemo(()=>{
    if(filter==="Resolved") return alerts.filter(a=>a.resolved);
    if(filter==="all") return [...alerts.filter(a=>!a.resolved),...alerts.filter(a=>a.resolved)];
    return alerts.filter(a=>a.severity===filter&&!a.resolved);
  },[filter,alerts]);

  const view=(a)=>{
    const s=shipments.find(x=>x.id===a.shipment);
    if(s) navigation.navigate("ShipmentDetails",{shipmentId:s.id});
    else navigation.navigate("Devices");
  };

  return <View style={styles.screen}>
    <View style={styles.top}><Text style={styles.title}>Alerts</Text></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {["all","Critical","Warning","Device","Resolved"].map(t=><TouchableOpacity key={t} onPress={()=>setFilter(t)} style={[styles.tab,filter===t&&styles.active]}><Text style={[styles.tabText,filter===t&&styles.activeText]}>{t==="all"?"All":t}</Text></TouchableOpacity>)}
      </ScrollView>
      {list.map(a=><AlertCard key={a.id} alert={a} onView={()=>view(a)} onAcknowledge={()=>setAlerts(prev=>prev.map(x=>x.id===a.id?{...x,resolved:true}:x))}/>)}
    </ScrollView>
  </View>
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  top:{height:58,justifyContent:"center",paddingHorizontal:18,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border},
  title:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},
  content:{padding:18,paddingBottom:105},tabs:{gap:8,marginBottom:16},
  tab:{paddingHorizontal:16,paddingVertical:9,borderRadius:99,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border},
  active:{backgroundColor:COLORS.green,borderColor:COLORS.green},tabText:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.muted},activeText:{color:COLORS.white}
});
