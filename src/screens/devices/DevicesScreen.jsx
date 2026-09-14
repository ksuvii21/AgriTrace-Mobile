import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import DeviceCard from "../../components/device/DeviceCard";
import Loader from "../../components/common/Loader";
import { getDevices } from "../../api/deviceApi";
import { normalizeDevice } from "../../utils/apiMappers";
import { useLanguage } from "../../context/LanguageContext";

export default function DevicesScreen({navigation}) {
  const {t}=useLanguage();
  const [devices,setDevices]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null),[search,setSearch]=useState("");
  const load=useCallback(async()=>{try{setError(null);setDevices((await getDevices()||[]).map(normalizeDevice))}catch(e){setError(e)}finally{setLoading(false)}},[]);
  useEffect(()=>{load()},[load]);
  const list=useMemo(()=>devices.filter(d=>!search||d.id.toLowerCase().includes(search.toLowerCase())),[devices,search]);
  if(loading)return <Loader text={t("devices_loading")}/>;
  return <View style={styles.screen}><View style={styles.top}><Text style={styles.title}>{t("devices_title")}</Text></View><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={load}/>}><View style={styles.search}><Ionicons name="search" size={18} color={COLORS.muted}/><TextInput value={search} onChangeText={setSearch} placeholder={t("devices_search_placeholder")} placeholderTextColor={COLORS.muted} style={styles.input}/></View>{error?<Text style={styles.error}>{error.message}</Text>:null}{list.map(d=><DeviceCard key={d.id} device={d} onPress={()=>navigation.navigate("DeviceDetails",{deviceId:d.id})}/>)}</ScrollView></View>
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},top:{height:58,justifyContent:"center",paddingHorizontal:18,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border},title:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},content:{padding:18,paddingBottom:105},search:{flexDirection:"row",alignItems:"center",gap:9,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,marginBottom:14},input:{flex:1,minHeight:46,fontFamily:"Inter_400Regular",fontSize:13.5,color:COLORS.text},error:{fontFamily:"Inter_500Medium",fontSize:12,color:COLORS.critical,marginBottom:10}})
