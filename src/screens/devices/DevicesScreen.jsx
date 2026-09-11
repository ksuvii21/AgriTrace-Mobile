import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { devices } from "../../data/mockData";
import DeviceCard from "../../components/device/DeviceCard";

export default function DevicesScreen({navigation}) {
  const [search,setSearch] = useState("");
  const list = useMemo(()=>devices.filter(d=>!search||d.id.toLowerCase().includes(search.toLowerCase())),[search]);
  return <View style={styles.screen}>
    <View style={styles.top}><Text style={styles.title}>Device Status</Text></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.search}><Ionicons name="search" size={18} color={COLORS.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="Search devices..." placeholderTextColor={COLORS.muted} style={styles.input}/></View>
      {list.map(d=><DeviceCard key={d.id} device={d} onPress={()=>navigation.navigate("DeviceDetails",{deviceId:d.id})}/>)}
    </ScrollView>
  </View>
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  top:{height:58,justifyContent:"center",paddingHorizontal:18,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border},
  title:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},
  content:{padding:18,paddingBottom:105},
  search:{flexDirection:"row",alignItems:"center",gap:9,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,marginBottom:14},
  input:{flex:1,minHeight:46,fontFamily:"Inter_400Regular",fontSize:13.5,color:COLORS.text}
});
