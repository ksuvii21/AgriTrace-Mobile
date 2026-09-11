import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import COLORS from "../../constants/colors";

export default function MiniLineChart({ data = [], stroke = COLORS.blue, height = 120 }) {
  const width = 320;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max-min);
  const points = data.map((v,i)=>{
    const x=(i/(Math.max(1,data.length-1)))*width;
    const y=height-10-((v-min)/range)*(height-20);
    return `${x},${y}`;
  }).join(" ");
  return <View style={{height}}><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Polyline points={points} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/></Svg></View>
}
