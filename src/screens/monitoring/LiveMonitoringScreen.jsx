import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../constants/colors";
import TopBar from "../../components/common/TopBar";
import SensorCard from "../../components/device/SensorCard";
import MiniLineChart from "../../components/common/MiniLineChart";
import Loader from "../../components/common/Loader";
import { getLatestTelemetryByShipment, getTelemetryHistoryByShipment } from "../../api/telemetryApi";
import { createAuthenticatedSocket, subscribeToShipment, unsubscribeFromShipment } from "../../services/websocket";
import { isTempWarning,isHumidityWarning } from "../../utils/statusUtils";

export default function LiveMonitoringScreen({navigation,route}) {
  const shipmentId=route.params?.shipmentId;
  const [current,setCurrent]=useState(null),[history,setHistory]=useState([]),[connected,setConnected]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(null);
  const socketRef=useRef(null);

  useEffect(()=>{
    let mounted=true;
    (async()=>{
      try{
        const [latest,hist]=await Promise.all([getLatestTelemetryByShipment(shipmentId),getTelemetryHistoryByShipment(shipmentId,{limit:20})]);
        if(!mounted)return;setCurrent(latest);setHistory([...(hist||[])].reverse());
        const ws=await createAuthenticatedSocket({
          onOpen:(_,socket)=>{if(!mounted)return;setConnected(true);subscribeToShipment(socket,shipmentId)},
          onMessage:(event)=>{if(!mounted)return;if(event.type==="telemetry.updated"&&event.data?.shipmentId===shipmentId){setCurrent(event.data);setHistory(prev=>[...prev.slice(-19),event.data])}},
          onClose:()=>mounted&&setConnected(false),
          onError:()=>mounted&&setConnected(false),
        });
        socketRef.current=ws;
      }catch(e){if(mounted)setError(e)}
      finally{if(mounted)setLoading(false)}
    })();
    return ()=>{mounted=false;const ws=socketRef.current;if(ws){unsubscribeFromShipment(ws,shipmentId);ws.close()}};
  },[shipmentId]);

  if(loading)return <Loader text="Connecting live telemetry..."/>;
  const temp=history.map(x=>Number(x.temperature)).filter(Number.isFinite),hum=history.map(x=>Number(x.humidity)).filter(Number.isFinite),gas=history.map(x=>Number(x.gasLevel)).filter(Number.isFinite);
  return <View style={styles.screen}><TopBar title="Live Monitoring" navigation={navigation}/><ScrollView contentContainerStyle={styles.content}>
    <LinearGradient colors={[COLORS.green,COLORS.blue]} style={styles.header}><View><Text style={styles.ship}>{shipmentId}</Text><Text style={styles.device}>Device {current?.deviceId||"—"}</Text></View><View style={styles.live}><View style={[styles.liveDot,{backgroundColor:connected?"#5CFF9D":COLORS.warning}]}/><Text style={styles.liveText}>{connected?"LIVE":"RECONNECTING"}</Text></View></LinearGradient>
    {error?<Text style={styles.err}>{error.message}</Text>:null}
    <View style={styles.grid}><SensorCard icon="thermometer" value={current?.temperature==null?"—":`${Number(current.temperature).toFixed(1)}°C`} label="Temperature" warning={current?.temperature!=null&&isTempWarning(current.temperature)}/><SensorCard icon="water-percent" value={current?.humidity==null?"—":`${Number(current.humidity).toFixed(0)}%`} label="Humidity" warning={current?.humidity!=null&&isHumidityWarning(current.humidity)}/><SensorCard icon="weather-windy" value={current?.gasLevel==null?"—":`${current.gasLevel}`} label="Gas Level"/><SensorCard icon="battery-high" value={current?.battery==null?"—":`${current.battery}%`} label="Battery"/></View>
    <Chart title="Temperature" data={temp} stroke={COLORS.blue}/><Chart title="Humidity" data={hum} stroke={COLORS.emerald}/><Chart title="Gas Level" data={gas} stroke={COLORS.navy}/>
  </ScrollView></View>
}
function Chart({title,data,stroke}){return <View style={styles.chart}><Text style={styles.chartTitle}>{title}</Text>{data.length>1?<MiniLineChart data={data} stroke={stroke}/>:<Text style={styles.noData}>Waiting for more readings...</Text>}</View>}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18,paddingBottom:35},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderRadius:16,padding:16,marginBottom:16},ship:{fontFamily:"Inter_700Bold",fontSize:14.5,color:COLORS.white},device:{fontFamily:"Inter_400Regular",fontSize:11,color:"rgba(255,255,255,.85)",marginTop:3},live:{flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"rgba(255,255,255,.18)",paddingHorizontal:10,paddingVertical:6,borderRadius:99},liveDot:{width:7,height:7,borderRadius:4},liveText:{fontFamily:"Inter_700Bold",fontSize:9.5,color:COLORS.white},err:{fontFamily:"Inter_500Medium",fontSize:12,color:COLORS.critical,marginBottom:10},grid:{flexDirection:"row",flexWrap:"wrap",gap:"4%",rowGap:12,marginBottom:18},chart:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:14,marginBottom:14},chartTitle:{fontFamily:"Manrope_700Bold",fontSize:12.5,color:COLORS.text,marginBottom:6},noData:{fontFamily:"Inter_400Regular",fontSize:11.5,color:COLORS.muted,paddingVertical:35,textAlign:"center"}})
