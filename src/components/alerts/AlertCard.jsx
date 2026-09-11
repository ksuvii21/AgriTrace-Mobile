import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import COLORS from "../../constants/colors";

const theme = {
  Critical:{bg:COLORS.criticalLight,fg:COLORS.critical},
  Warning:{bg:COLORS.warningLight,fg:"#A16207"},
  Device:{bg:"#EDE9FE",fg:"#6D28D9"},
};

export default function AlertCard({ alert, onView, onAcknowledge }) {
  const t = theme[alert.severity] || theme.Warning;
  return (
    <View style={[styles.card, alert.resolved && {opacity:.5}]}>
      <Text style={[styles.tag,{backgroundColor:t.bg,color:t.fg}]}>{alert.severity.toUpperCase()}</Text>
      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.sub}>{alert.shipment}</Text>
      <Text style={styles.detail}>{alert.detail}</Text>
      <Text style={styles.time}>{alert.resolved ? "Resolved · " : ""}{alert.time}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.ghost} onPress={onView}>
          <Text style={styles.ghostText}>{alert.type === "Device" ? "View Device" : "View Shipment"}</Text>
        </TouchableOpacity>
        {!alert.resolved && (
          <TouchableOpacity style={styles.primary} onPress={onAcknowledge}>
            <Text style={styles.primaryText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:16,marginBottom:12},
  tag:{alignSelf:"flex-start",fontFamily:"Inter_700Bold",fontSize:9.5,paddingHorizontal:9,paddingVertical:4,borderRadius:6,marginBottom:7},
  title:{fontFamily:"Inter_700Bold",fontSize:13.5,color:COLORS.text},
  sub:{fontFamily:"Inter_400Regular",fontSize:12,color:COLORS.muted,marginTop:2},
  detail:{fontFamily:"Inter_400Regular",fontSize:12,color:COLORS.text,marginTop:5},
  time:{fontFamily:"Inter_400Regular",fontSize:10.5,color:COLORS.muted,marginTop:5,marginBottom:11},
  actions:{flexDirection:"row",gap:8},
  ghost:{flex:1,alignItems:"center",paddingVertical:10,borderRadius:10,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.backgroundBlue},
  ghostText:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.text},
  primary:{flex:1,alignItems:"center",paddingVertical:10,borderRadius:10,backgroundColor:COLORS.green},
  primaryText:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.white},
});
