import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { devices } from "../../data/mockData";
import TopBar from "../../components/common/TopBar";
import { deviceStatusColor } from "../../utils/statusUtils";

export default function DeviceDetailsScreen({navigation,route}) {
  const d=devices.find(x=>x.id===route.params?.deviceId)||devices[0];
  const color=deviceStatusColor(d.status);
  return <View style={styles.screen}><TopBar title="Device Details" navigation={navigation}/>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><View style={[styles.dot,{backgroundColor:color}]}/><Text style={styles.id}>{d.id}</Text><Text style={[styles.status,{color}]}>{d.status}</Text></View>
      <Info label="Assigned Shipment" value={d.shipment||"Unassigned"}/>
      <Info label="Battery" value={`${d.battery}%`}/>
      <Info label="Last Seen" value={d.lastSeen}/>
      <Info label="Latest Temperature" value={`${d.temp}°C`}/>
      <TouchableOpacity style={styles.button} onPress={()=>navigation.navigate("AssignDevice",{deviceId:d.id})}><Ionicons name="link-outline" size={18} color={COLORS.white}/><Text style={styles.buttonText}>Assign Device</Text></TouchableOpacity>
    </ScrollView>
  </View>
}
function Info({label,value}){return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18},
  hero:{alignItems:"center",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:18,padding:24,marginBottom:14},
  dot:{width:16,height:16,borderRadius:8,marginBottom:10},id:{fontFamily:"Manrope_800ExtraBold",fontSize:18,color:COLORS.text},
  status:{fontFamily:"Inter_700Bold",fontSize:12,marginTop:5},
  info:{flexDirection:"row",justifyContent:"space-between",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:15,marginBottom:10},
  label:{fontFamily:"Inter_500Medium",fontSize:12,color:COLORS.muted},value:{fontFamily:"Inter_700Bold",fontSize:12.5,color:COLORS.text},
  button:{flexDirection:"row",gap:8,alignItems:"center",justifyContent:"center",backgroundColor:COLORS.green,borderRadius:12,paddingVertical:14,marginTop:6},
  buttonText:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.white}
});
