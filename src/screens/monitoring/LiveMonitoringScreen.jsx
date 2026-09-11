import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constants/colors";
import { shipments } from "../../data/mockData";
import TopBar from "../../components/common/TopBar";
import SensorCard from "../../components/device/SensorCard";
import MiniLineChart from "../../components/common/MiniLineChart";
import { isTempWarning,isHumidityWarning } from "../../utils/statusUtils";

const series=(base,variance,n=10)=>Array.from({length:n},()=>+(base+(Math.random()*2-1)*variance).toFixed(1));

export default function LiveMonitoringScreen({navigation,route}) {
  const s=shipments.find(x=>x.id===route.params?.shipmentId)||shipments[0];
  const [state,setState]=useState({temp:s.temperature,hum:s.humidity,gas:20});
  const [tempData,setTempData]=useState(series(s.temperature,1.2));
  const [humData,setHumData]=useState(series(s.humidity,3));
  const [gasData,setGasData]=useState(series(20,5));

  useEffect(()=>{
    const timer=setInterval(()=>{
      setState(prev=>{
        const next={
          temp:Math.max(5,Math.min(34,prev.temp+(Math.random()*2-1)*1.1)),
          hum:Math.max(30,Math.min(95,prev.hum+(Math.random()*2-1)*2.5)),
          gas:Math.max(5,Math.min(70,prev.gas+(Math.random()*2-1)*4))
        };
        setTempData(d=>[...d.slice(1),+next.temp.toFixed(1)]);
        setHumData(d=>[...d.slice(1),+next.hum.toFixed(1)]);
        setGasData(d=>[...d.slice(1),+next.gas.toFixed(1)]);
        return next;
      })
    },3500);
    return ()=>clearInterval(timer);
  },[]);

  return <View style={styles.screen}><TopBar title="Live Monitoring" navigation={navigation}/>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[COLORS.green,COLORS.blue]} style={styles.header}>
        <View><Text style={styles.ship}>{s.id}</Text><Text style={styles.device}>Device {s.device||"—"}</Text></View>
        <View style={styles.live}><View style={styles.liveDot}/><Text style={styles.liveText}>LIVE</Text></View>
      </LinearGradient>

      <View style={styles.sensorGrid}>
        <SensorCard icon="thermometer" value={`${state.temp.toFixed(1)}°C`} label="Safe range: 8°C – 28°C" warning={isTempWarning(state.temp)}/>
        <SensorCard icon="water-percent" value={`${state.hum.toFixed(0)}%`} label="Safe range: 40% – 80%" warning={isHumidityWarning(state.hum)}/>
        <SensorCard icon="weather-windy" value={state.gas<50?"Normal":"Elevated"} label="Gas Level" warning={state.gas>=50}/>
        <SensorCard icon="battery-high" value={`${s.battery}%`} label="Battery"/>
      </View>

      <ChartCard title="Temperature" data={tempData} stroke={COLORS.blue}/>
      <ChartCard title="Humidity" data={humData} stroke={COLORS.emerald}/>
      <ChartCard title="Gas Level" data={gasData} stroke={COLORS.navy}/>
    </ScrollView>
  </View>
}
function ChartCard({title,data,stroke}){return <View style={styles.chart}><Text style={styles.chartTitle}>{title}</Text><MiniLineChart data={data} stroke={stroke}/></View>}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18,paddingBottom:35},
  header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderRadius:16,padding:16,marginBottom:16},
  ship:{fontFamily:"Inter_700Bold",fontSize:14.5,color:COLORS.white},device:{fontFamily:"Inter_400Regular",fontSize:11,color:"rgba(255,255,255,.85)",marginTop:3},
  live:{flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"rgba(255,255,255,.18)",paddingHorizontal:10,paddingVertical:6,borderRadius:99},liveDot:{width:7,height:7,borderRadius:4,backgroundColor:"#5CFF9D"},liveText:{fontFamily:"Inter_700Bold",fontSize:10.5,color:COLORS.white},
  sensorGrid:{flexDirection:"row",flexWrap:"wrap",gap:"4%",rowGap:12,marginBottom:18},
  chart:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:14,marginBottom:14},
  chartTitle:{fontFamily:"Manrope_700Bold",fontSize:12.5,color:COLORS.text,marginBottom:6}
});
