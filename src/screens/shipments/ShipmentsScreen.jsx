import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { shipments } from "../../data/mockData";
import ShipmentCard from "../../components/shipment/ShipmentCard";

export default function ShipmentsScreen({ navigation }) {
  const [tab,setTab] = useState("active");
  const [search,setSearch] = useState("");

  const list = useMemo(() => shipments
    .filter(s => s.category === tab)
    .filter(s => !search || s.id.toLowerCase().includes(search.toLowerCase()) || s.product.toLowerCase().includes(search.toLowerCase()) || s.destination.toLowerCase().includes(search.toLowerCase()))
  ,[tab,search]);

  return (
    <View style={styles.screen}>
      <View style={styles.top}><Text style={styles.topTitle}>My Shipments</Text></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={COLORS.muted}/>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search shipments..." placeholderTextColor={COLORS.muted} style={styles.input}/>
        </View>
        <View style={styles.tabs}>
          {["active","upcoming","completed"].map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab,tab===t && styles.tabActive]}>
              <Text style={[styles.tabText,tab===t && styles.tabTextActive]}>{t[0].toUpperCase()+t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {list.length ? list.map(s => (
          <ShipmentCard key={s.id} shipment={s} onPress={() => navigation.navigate("ShipmentDetails",{shipmentId:s.id})}/>
        )) : <Text style={styles.empty}>No shipments in this category.</Text>}
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  top:{height:58,justifyContent:"center",paddingHorizontal:18,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border},
  topTitle:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},
  content:{padding:18,paddingBottom:105},
  search:{flexDirection:"row",alignItems:"center",gap:9,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,marginBottom:14},
  input:{flex:1,minHeight:46,fontFamily:"Inter_400Regular",fontSize:13.5,color:COLORS.text},
  tabs:{flexDirection:"row",gap:8,marginBottom:16},
  tab:{paddingHorizontal:16,paddingVertical:9,borderRadius:99,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border},
  tabActive:{backgroundColor:COLORS.green,borderColor:COLORS.green},
  tabText:{fontFamily:"Inter_700Bold",fontSize:12.5,color:COLORS.muted},
  tabTextActive:{color:COLORS.white},
  empty:{textAlign:"center",fontFamily:"Inter_500Medium",fontSize:13,color:COLORS.muted,marginTop:40}
});
