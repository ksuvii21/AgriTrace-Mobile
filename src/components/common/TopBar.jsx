import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";

export default function TopBar({ title, navigation, rightIcon, onRightPress }) {
  return (
    <View style={styles.bar}>
      {navigation?.canGoBack() ? (
        <TouchableOpacity style={styles.icon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={19} color={COLORS.text} />
        </TouchableOpacity>
      ) : <View style={styles.spacer} />}
      <Text style={styles.title}>{title}</Text>
      {rightIcon ? (
        <TouchableOpacity style={styles.icon} onPress={onRightPress}>
          <Ionicons name={rightIcon} size={19} color={COLORS.text} />
        </TouchableOpacity>
      ) : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar:{height:58, flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, backgroundColor:COLORS.white, borderBottomWidth:1, borderBottomColor:COLORS.border},
  title:{fontFamily:"Manrope_800ExtraBold", fontSize:15.5, color:COLORS.text},
  icon:{width:38,height:38,borderRadius:19,backgroundColor:COLORS.backgroundBlue,alignItems:"center",justifyContent:"center"},
  spacer:{width:38}
});
