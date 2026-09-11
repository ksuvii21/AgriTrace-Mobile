import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";

export default function SensorCard({ icon, value, label, status, warning = false, compact = false }) {
  return (
    <View style={[styles.card, warning && styles.warning, compact && styles.compact]}>
      <MaterialCommunityIcons name={icon} size={18} color={COLORS.blue}/>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {status ? (
        <Text style={[styles.status, warning ? styles.statusWarning : styles.statusSafe]}>{status}</Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  card:{width:"48%",backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:14},
  compact:{width:"31%"},
  warning:{borderColor:COLORS.warning,backgroundColor:"#FFF8EC"},
  value:{fontFamily:"Manrope_800ExtraBold",fontSize:19,color:COLORS.text,marginTop:6},
  label:{fontFamily:"Inter_400Regular",fontSize:11,color:COLORS.muted,marginTop:2},
  status:{alignSelf:"flex-start",fontFamily:"Inter_700Bold",fontSize:9.5,paddingHorizontal:8,paddingVertical:3,borderRadius:6,marginTop:7},
  statusSafe:{backgroundColor:COLORS.greenLight,color:COLORS.forest},
  statusWarning:{backgroundColor:COLORS.warningLight,color:"#A16207"},
});
