import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { shipments } from "../../data/mockData";
import TopBar from "../../components/common/TopBar";
import SensorCard from "../../components/device/SensorCard";
import { statusLabel, isTempWarning, isHumidityWarning } from "../../utils/statusUtils";

export default function ShipmentDetailsScreen({ navigation, route }) {
  const s = shipments.find(x => x.id === route.params?.shipmentId) || shipments[0];
  const stageIdx = {PICKUP_PENDING:0,IN_TRANSIT:2,ALERT:2,DELAYED:2,DELIVERED:4}[s.status] ?? 2;
  const steps = ["Created","Picked Up","In Transit","Warehouse","Delivered"];
  const tempWarn = isTempWarning(s.temperature);
  const humWarn = isHumidityWarning(s.humidity);
  const gasWarn = s.gasStatus !== "Safe";

  return (
    <View style={styles.screen}>
      <TopBar title={s.id} navigation={navigation} rightIcon="ellipsis-horizontal"/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.green,COLORS.blue]} style={styles.hero}>
          <Text style={styles.heroId}>{s.id}</Text>
          <Text style={styles.heroTitle}>{s.product}</Text>
          <Text style={styles.heroBadge}>{statusLabel(s.status)}</Text>
          <Text style={styles.quantity}>Quantity: {s.quantity}</Text>
        </LinearGradient>

        <View style={styles.route}>
          <Ionicons name="location" size={18} color={COLORS.muted}/>
          <Text style={styles.routeText}>{s.source}</Text>
          <Ionicons name="arrow-down" size={15} color={COLORS.muted}/>
          <Text style={styles.routeText}>{s.destination} Warehouse</Text>
        </View>

        <View style={styles.steps}>
          {steps.map((name,i) => (
            <View key={name} style={styles.stepItem}>
              {i < steps.length-1 && <View style={[styles.stepLine, i < stageIdx && {backgroundColor:COLORS.emerald}]}/>}
              <View style={[styles.stepDot,i<stageIdx&&{backgroundColor:COLORS.emerald},i===stageIdx&&{backgroundColor:COLORS.blue}]}>
                {i<stageIdx ? <Ionicons name="checkmark" size={12} color={COLORS.white}/> : null}
              </View>
              <Text style={styles.stepLabel}>{name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sensorGrid}>
          <SensorCard icon="thermometer" value={`${s.temperature}°C`} label="Temperature" status={tempWarn?"WARNING":"SAFE"} warning={tempWarn}/>
          <SensorCard icon="water-percent" value={`${s.humidity}%`} label="Humidity" status={humWarn?"WARNING":"SAFE"} warning={humWarn}/>
          <SensorCard icon="weather-windy" value={s.gasStatus} label="Gas" status={gasWarn?"WARNING":"SAFE"} warning={gasWarn}/>
          <SensorCard icon="battery-high" value={`${s.battery}%`} label="Battery" status="GOOD"/>
        </View>

        <View style={styles.sync}>
          <View><Text style={styles.syncLabel}>Device</Text><Text style={styles.syncValue}>{s.device || "Not assigned"}</Text></View>
          <View style={{alignItems:"flex-end"}}><Text style={styles.syncLabel}>Last synchronized</Text><Text style={styles.syncValue}>2 minutes ago</Text></View>
        </View>

        <View style={styles.actions}>
          <Action icon="pulse-outline" text="Live Monitoring" onPress={() => navigation.navigate("LiveMonitoring",{shipmentId:s.id})}/>
          <Action icon="git-branch-outline" text="View Traceability" onPress={() => navigation.navigate("Traceability",{shipmentId:s.id})}/>
          <Action icon="call-outline" text="Call Contact" onPress={() => Alert.alert("Demo","Calling driver / shipment contact.")}/>
          <Action icon="flag-outline" text="Report Problem" onPress={() => Alert.alert("Report Problem",`A demo issue report for ${s.id} would be submitted here.`)}/>
        </View>
      </ScrollView>
    </View>
  );
}

function Action({icon,text,onPress}) {
  return <TouchableOpacity style={styles.action} onPress={onPress}><Ionicons name={icon} size={18} color={COLORS.green}/><Text style={styles.actionText}>{text}</Text></TouchableOpacity>
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  content:{padding:18,paddingBottom:35},
  hero:{borderRadius:20,padding:18,marginBottom:18},
  heroId:{fontFamily:"Inter_500Medium",fontSize:12,color:"rgba(255,255,255,.85)"},
  heroTitle:{fontFamily:"Manrope_800ExtraBold",fontSize:20,color:COLORS.white,marginTop:4},
  heroBadge:{alignSelf:"flex-start",fontFamily:"Inter_700Bold",fontSize:10.5,color:COLORS.white,backgroundColor:"rgba(255,255,255,.18)",paddingHorizontal:12,paddingVertical:5,borderRadius:99,marginTop:9},
  quantity:{fontFamily:"Inter_500Medium",fontSize:12.5,color:"rgba(255,255,255,.9)",marginTop:12},
  route:{flexDirection:"row",alignItems:"center",gap:9,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:15,marginBottom:18},
  routeText:{fontFamily:"Inter_500Medium",fontSize:12.5,color:COLORS.text},
  steps:{flexDirection:"row",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,paddingVertical:18,paddingHorizontal:7,marginBottom:18},
  stepItem:{flex:1,alignItems:"center",position:"relative"},
  stepDot:{width:24,height:24,borderRadius:12,backgroundColor:COLORS.border,alignItems:"center",justifyContent:"center",zIndex:2},
  stepLine:{position:"absolute",height:2,backgroundColor:COLORS.border,width:"100%",left:"50%",top:11,zIndex:1},
  stepLabel:{fontFamily:"Inter_500Medium",fontSize:8.5,color:COLORS.muted,textAlign:"center",marginTop:6},
  sensorGrid:{flexDirection:"row",flexWrap:"wrap",gap:"4%",rowGap:12,marginBottom:18},
  sync:{flexDirection:"row",justifyContent:"space-between",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:15,marginBottom:18},
  syncLabel:{fontFamily:"Inter_400Regular",fontSize:11,color:COLORS.muted},
  syncValue:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.text,marginTop:2},
  actions:{flexDirection:"row",flexWrap:"wrap",gap:"4%",rowGap:10},
  action:{width:"48%",flexDirection:"row",alignItems:"center",gap:9,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:12},
  actionText:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.text}
});
