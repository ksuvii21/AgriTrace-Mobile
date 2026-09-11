import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import COLORS from "../../constants/colors";
import { shipments } from "../../data/mockData";
import TopBar from "../../components/common/TopBar";

export default function AssignDeviceScreen({navigation,route}) {
  const [selected,setSelected]=useState(null);
  const deviceId=route.params?.deviceId;
  const available=shipments.filter(s=>s.category!=="completed");
  return <View style={styles.screen}><TopBar title="Assign Device" navigation={navigation}/>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Assign <Text style={styles.bold}>{deviceId}</Text> to a shipment.</Text>
      {available.map(s=><TouchableOpacity key={s.id} onPress={()=>setSelected(s.id)} style={[styles.row,selected===s.id&&styles.selected]}><View><Text style={styles.id}>{s.id}</Text><Text style={styles.product}>{s.product} · {s.source} → {s.destination}</Text></View><View style={[styles.radio,selected===s.id&&styles.radioOn]}/></TouchableOpacity>)}
      <TouchableOpacity disabled={!selected} style={[styles.button,!selected&&{opacity:.45}]} onPress={()=>Alert.alert("Assigned",`${deviceId} assigned to ${selected} (demo).`,[{text:"OK",onPress:()=>navigation.goBack()}])}><Text style={styles.buttonText}>Confirm Assignment</Text></TouchableOpacity>
    </ScrollView>
  </View>
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18},lead:{fontFamily:"Inter_400Regular",fontSize:13,color:COLORS.muted,marginBottom:16},bold:{fontFamily:"Inter_700Bold",color:COLORS.text},
  row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:14,padding:15,marginBottom:10},
  selected:{borderColor:COLORS.green,backgroundColor:COLORS.greenLight},id:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.text},product:{fontFamily:"Inter_400Regular",fontSize:11.5,color:COLORS.muted,marginTop:3},
  radio:{width:18,height:18,borderRadius:9,borderWidth:2,borderColor:COLORS.border},radioOn:{borderWidth:5,borderColor:COLORS.green,backgroundColor:COLORS.white},
  button:{backgroundColor:COLORS.green,borderRadius:12,paddingVertical:14,alignItems:"center",marginTop:8},buttonText:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.white}
});
