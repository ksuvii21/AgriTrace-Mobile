import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";

export default function ProfileScreen({navigation}) {
  const [prefs,setPrefs]=useState({temp:true,hum:true,gas:true,offline:true,shipment:false});
  const toggle=k=>setPrefs(p=>({...p,[k]:!p[k]}));

  const logout=()=>Alert.alert("Log out of AgriTrace?","You'll need to sign in again to access your shipments and devices.",[
    {text:"Cancel",style:"cancel"},
    {text:"Log Out",style:"destructive",onPress:()=>navigation.getParent()?.replace("Login")}
  ]);

  return <View style={styles.screen}><View style={styles.top}><Text style={styles.title}>Profile</Text></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHead}>
        <LinearGradient colors={[COLORS.green,COLORS.blue]} style={styles.avatar}><Text style={styles.avatarText}>KG</Text></LinearGradient>
        <Text style={styles.name}>Kritika Gupta</Text><Text style={styles.muted}>Operations Manager</Text><Text style={styles.role}>AgriTrace Demo Network</Text>
      </View>

      <Section>
        <Item icon="person-outline" text="Personal Information"/>
        <Item icon="business-outline" text="Organization"/>
        <Item icon="id-card-outline" text="Role: Operations Manager" last/>
      </Section>

      <Label text="Notification Settings"/>
      <Section>
        <Toggle label="Temperature Alerts" value={prefs.temp} onValueChange={()=>toggle("temp")}/>
        <Toggle label="Humidity Alerts" value={prefs.hum} onValueChange={()=>toggle("hum")}/>
        <Toggle label="Gas Alerts" value={prefs.gas} onValueChange={()=>toggle("gas")}/>
        <Toggle label="Device Offline Alerts" value={prefs.offline} onValueChange={()=>toggle("offline")}/>
        <Toggle label="Shipment Updates" value={prefs.shipment} onValueChange={()=>toggle("shipment")} last/>
      </Section>

      <Label text="App Preferences"/><Section><Item icon="color-palette-outline" text="Theme"/><Item icon="language-outline" text="Language" last/></Section>
      <Label text="Security & Support"/><Section><Item icon="lock-closed-outline" text="Security"/><Item icon="help-circle-outline" text="Help & Support" last/></Section>

      <TouchableOpacity style={styles.logout} onPress={logout}><Ionicons name="log-out-outline" size={19} color={COLORS.critical}/><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </ScrollView>
  </View>
}
function Label({text}){return <Text style={styles.label}>{text}</Text>}
function Section({children}){return <View style={styles.section}>{children}</View>}
function Item({icon,text,last}){return <TouchableOpacity style={[styles.item,last&&{borderBottomWidth:0}]}><Ionicons name={icon} size={19} color={COLORS.green}/><Text style={styles.itemText}>{text}</Text><Ionicons name="chevron-forward" size={15} color={COLORS.muted}/></TouchableOpacity>}
function Toggle({label,value,onValueChange,last}){return <View style={[styles.toggle,last&&{borderBottomWidth:0}]}><Text style={styles.itemText}>{label}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{false:COLORS.border,true:COLORS.emerald}} thumbColor={COLORS.white}/></View>}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},top:{height:58,justifyContent:"center",paddingHorizontal:18,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border},
  title:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},content:{padding:18,paddingBottom:105},
  profileHead:{alignItems:"center",paddingVertical:14,marginBottom:8},avatar:{width:74,height:74,borderRadius:37,alignItems:"center",justifyContent:"center",marginBottom:8},avatarText:{fontFamily:"Manrope_800ExtraBold",fontSize:24,color:COLORS.white},
  name:{fontFamily:"Manrope_800ExtraBold",fontSize:17,color:COLORS.text},muted:{fontFamily:"Inter_400Regular",fontSize:12.5,color:COLORS.muted,marginTop:2},role:{fontFamily:"Inter_700Bold",fontSize:11,color:COLORS.forest,backgroundColor:COLORS.greenLight,paddingHorizontal:10,paddingVertical:4,borderRadius:99,marginTop:7},
  section:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,overflow:"hidden",marginBottom:18},
  item:{flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:COLORS.border},itemText:{flex:1,fontFamily:"Inter_600SemiBold",fontSize:13,color:COLORS.text},
  toggle:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16,paddingVertical:9,borderBottomWidth:1,borderBottomColor:COLORS.border},
  label:{fontFamily:"Manrope_800ExtraBold",fontSize:13.5,color:COLORS.text,marginBottom:10},
  logout:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,backgroundColor:COLORS.criticalLight,borderRadius:12,paddingVertical:14},logoutText:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.critical}
});
