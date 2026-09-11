import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { shipments, activity, roleSummaries, alertsSeed } from "../../data/mockData";
import ShipmentStatus from "../../components/shipment/ShipmentStatus";

export default function DashboardScreen({ navigation }) {
  const role = "admin";
  const shipment = shipments[0];
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  }, []);

  const actions = [
    ["Scan","qr-code-outline","Scan QR"],
    ["Shipments","cube-outline","My Shipments"],
    ["Devices","hardware-chip-outline","Device Status"],
    ["Alerts","warning-outline","Alerts"],
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>Kritika Gupta</Text>
          <Text style={styles.role}>Operations Manager</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Alerts")}>
            <Ionicons name="notifications-outline" size={19} color={COLORS.text}/>
            <View style={styles.redDot}/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate("Profile")}>
            <Text style={styles.avatarText}>KG</Text>
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient colors={[COLORS.green,COLORS.emerald]} style={styles.summary}>
        {roleSummaries[role].map(([v,l]) => (
          <View key={l} style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{v}</Text>
            <Text style={styles.summaryLabel}>{l}</Text>
          </View>
        ))}
      </LinearGradient>

      <SectionTitle title="Current Shipment" />
      <View style={styles.shipmentCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.shipId}>{shipment.id}</Text>
            <Text style={styles.product}>{shipment.product}</Text>
          </View>
          <ShipmentStatus status={shipment.status}/>
        </View>
        <View style={styles.routeRow}>
          <Ionicons name="location" size={14} color={COLORS.muted}/>
          <Text style={styles.routeText}>{shipment.source}</Text>
          <Ionicons name="arrow-forward" size={13} color={COLORS.muted}/>
          <Text style={styles.routeText}>{shipment.destination}</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}><LinearGradient colors={[COLORS.green,COLORS.blue]} style={[styles.progressFill,{width:`${shipment.progress}%`}]} /></View>
          <Text style={styles.progressText}>{shipment.progress}%</Text>
        </View>
        <View style={styles.envGrid}>
          <Env icon="thermometer" value={`${shipment.temperature}°C`} label="Temp"/>
          <Env icon="water-percent" value={`${shipment.humidity}%`} label="Humidity"/>
          <Env icon="weather-windy" value={shipment.gasStatus} label="Gas"/>
          <Env icon="battery-high" value={`${shipment.battery}%`} label="Battery"/>
        </View>
        <TouchableOpacity style={styles.fullButton} onPress={() => navigation.navigate("ShipmentDetails",{shipmentId:shipment.id})}>
          <Text style={styles.fullButtonText}>View Shipment</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle title="Quick Actions" />
      <View style={styles.quickGrid}>
        {actions.map(([route,icon,label]) => (
          <TouchableOpacity key={label} style={styles.quick} onPress={() => navigation.navigate(route)}>
            <Ionicons name={icon} size={20} color={COLORS.green}/>
            <Text style={styles.quickText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Recent Activity" />
      {activity.map((item,i) => (
        <View key={i} style={styles.activity}>
          <View style={styles.activityIcon}>
            <MaterialCommunityIcons name={item.icon} size={16} color={COLORS.forest}/>
          </View>
          <View style={{flex:1}}>
            <Text style={styles.activityText}>{item.text}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function SectionTitle({title}) { return <Text style={styles.sectionTitle}>{title}</Text>; }
function Env({icon,value,label}) {
  return <View style={styles.env}><MaterialCommunityIcons name={icon} size={15} color={COLORS.blue}/><Text style={styles.envValue}>{value}</Text><Text style={styles.envLabel}>{label}</Text></View>
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  content:{padding:18,paddingBottom:105},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16},
  greeting:{fontFamily:"Inter_600SemiBold",fontSize:12.5,color:COLORS.muted},
  name:{fontFamily:"Manrope_800ExtraBold",fontSize:19,color:COLORS.text,marginTop:2},
  role:{alignSelf:"flex-start",fontFamily:"Inter_700Bold",fontSize:10.5,color:COLORS.forest,backgroundColor:COLORS.greenLight,paddingHorizontal:10,paddingVertical:4,borderRadius:20,marginTop:6},
  headerRight:{flexDirection:"row",alignItems:"center",gap:10},
  iconBtn:{width:38,height:38,borderRadius:19,backgroundColor:COLORS.backgroundBlue,alignItems:"center",justifyContent:"center"},
  redDot:{position:"absolute",right:7,top:7,width:7,height:7,borderRadius:4,backgroundColor:COLORS.critical},
  avatar:{width:38,height:38,borderRadius:19,backgroundColor:COLORS.blue,alignItems:"center",justifyContent:"center"},
  avatarText:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.white},
  summary:{borderRadius:20,padding:18,flexDirection:"row",flexWrap:"wrap",marginBottom:20},
  summaryItem:{width:"50%",marginBottom:14},
  summaryValue:{fontFamily:"Manrope_800ExtraBold",fontSize:24,color:COLORS.white},
  summaryLabel:{fontFamily:"Inter_400Regular",fontSize:11.5,color:"rgba(255,255,255,.85)"},
  sectionTitle:{fontFamily:"Manrope_800ExtraBold",fontSize:14.5,color:COLORS.text,marginBottom:10,marginTop:3},
  shipmentCard:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:16,marginBottom:22},
  rowBetween:{flexDirection:"row",justifyContent:"space-between"},
  shipId:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.muted},
  product:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text,marginTop:2},
  routeRow:{flexDirection:"row",alignItems:"center",gap:8,marginVertical:12},
  routeText:{fontFamily:"Inter_400Regular",fontSize:12.5,color:COLORS.muted},
  progressRow:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:14},
  progressTrack:{flex:1,height:7,backgroundColor:COLORS.border,borderRadius:7,overflow:"hidden"},
  progressFill:{height:"100%",borderRadius:7},
  progressText:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.text},
  envGrid:{flexDirection:"row",gap:7,marginBottom:14},
  env:{flex:1,backgroundColor:COLORS.backgroundBlue,borderRadius:10,paddingVertical:8,alignItems:"center"},
  envValue:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.text,marginTop:3},
  envLabel:{fontFamily:"Inter_400Regular",fontSize:9.5,color:COLORS.muted},
  fullButton:{backgroundColor:COLORS.green,borderRadius:12,paddingVertical:13,alignItems:"center"},
  fullButtonText:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.white},
  quickGrid:{flexDirection:"row",gap:9,marginBottom:22},
  quick:{flex:1,minHeight:78,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,alignItems:"center",justifyContent:"center",gap:8,paddingHorizontal:4},
  quickText:{fontFamily:"Inter_700Bold",fontSize:10,color:COLORS.text,textAlign:"center"},
  activity:{flexDirection:"row",gap:12,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:12,marginBottom:10},
  activityIcon:{width:30,height:30,borderRadius:9,backgroundColor:COLORS.greenLight,alignItems:"center",justifyContent:"center"},
  activityText:{fontFamily:"Inter_400Regular",fontSize:12.5,color:COLORS.text,lineHeight:18},
  activityTime:{fontFamily:"Inter_400Regular",fontSize:10.5,color:COLORS.muted,marginTop:3},
});
