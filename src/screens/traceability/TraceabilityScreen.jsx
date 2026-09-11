import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { shipments, traceabilitySteps } from "../../data/mockData";
import TopBar from "../../components/common/TopBar";

export default function TraceabilityScreen({navigation,route}) {
  const s=shipments.find(x=>x.id===route.params?.shipmentId)||shipments[0];
  return <View style={styles.screen}><TopBar title="Farm-to-Fork Journey" navigation={navigation}/>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.ship}>{s.id}</Text><Text style={styles.product}>{s.product}</Text>
      <View style={styles.timeline}>
        {traceabilitySteps.map((st,i)=><View key={`${st.title}-${i}`} style={styles.item}>
          <View style={styles.markerCol}>
            <View style={[styles.marker,st.status==="completed"&&styles.completed,st.status==="current"&&styles.current]}>
              {st.status==="completed"?<Ionicons name="checkmark" size={12} color={COLORS.white}/>:st.status==="current"?<Ionicons name="car-outline" size={13} color={COLORS.white}/>:null}
            </View>
            {i<traceabilitySteps.length-1&&<View style={[styles.line,st.status==="completed"&&{backgroundColor:COLORS.emerald}]}/>}
          </View>
          <View style={{flex:1,paddingBottom:22}}><Text style={styles.tTitle}>{st.title}</Text><Text style={styles.tSub}>{st.sub}</Text><Text style={styles.tTime}>{st.time}</Text></View>
        </View>)}
      </View>

      <View style={styles.integrity}>
        <View style={styles.integrityHead}><Ionicons name="shield-checkmark-outline" size={20} color={COLORS.forest}/><Text style={styles.integrityTitle}>Data Integrity</Text></View>
        <Text style={styles.verified}>✓ Verified</Text>
        <Text style={styles.note}>Shipment records have not been modified.</Text>
        <Row label="Latest Record Hash" value="0x91de7204fe88..."/>
        <Row label="Verification" value="VALID" green/>
        <TouchableOpacity style={styles.detailsBtn} onPress={()=>Alert.alert("Verification Details","Latest Hash: 0x91de7204fe88a...\nPrevious Hash: 0x74ab9030bd21...\nRecords: Unchanged\nStatus: VALID\n\nSimulated integrity check for MVP demonstration.")}><Text style={styles.detailsText}>View Verification Details</Text></TouchableOpacity>
      </View>
    </ScrollView>
  </View>
}
function Row({label,value,green}){return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={[styles.rowValue,green&&{color:COLORS.forest}]}>{value}</Text></View>}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},content:{padding:18,paddingBottom:35},
  ship:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},product:{fontFamily:"Inter_400Regular",fontSize:12.5,color:COLORS.muted,marginBottom:18},
  timeline:{marginBottom:20},item:{flexDirection:"row",gap:12},markerCol:{alignItems:"center",width:28},
  marker:{width:26,height:26,borderRadius:13,backgroundColor:COLORS.border,alignItems:"center",justifyContent:"center",zIndex:2},completed:{backgroundColor:COLORS.emerald},current:{backgroundColor:COLORS.blue},
  line:{position:"absolute",top:26,bottom:0,width:2,backgroundColor:COLORS.border},
  tTitle:{fontFamily:"Inter_700Bold",fontSize:13,color:COLORS.text},tSub:{fontFamily:"Inter_400Regular",fontSize:11.5,color:COLORS.muted,marginTop:1},tTime:{fontFamily:"Inter_400Regular",fontSize:10.5,color:COLORS.muted,marginTop:2},
  integrity:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:16},
  integrityHead:{flexDirection:"row",gap:8,alignItems:"center"},integrityTitle:{fontFamily:"Manrope_700Bold",fontSize:14,color:COLORS.text},
  verified:{alignSelf:"flex-start",backgroundColor:COLORS.greenLight,color:COLORS.forest,fontFamily:"Inter_700Bold",fontSize:11,paddingHorizontal:10,paddingVertical:4,borderRadius:99,marginVertical:9},
  note:{fontFamily:"Inter_400Regular",fontSize:12,color:COLORS.muted,marginBottom:12},row:{flexDirection:"row",justifyContent:"space-between",marginBottom:8},
  rowLabel:{fontFamily:"Inter_400Regular",fontSize:12,color:COLORS.muted},rowValue:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.text},
  detailsBtn:{marginTop:6,alignItems:"center",backgroundColor:COLORS.backgroundBlue,borderWidth:1,borderColor:COLORS.border,borderRadius:11,paddingVertical:11},detailsText:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.text}
});
