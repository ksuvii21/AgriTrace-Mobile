import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import COLORS from "../../constants/colors";
import TopBar from "../../components/common/TopBar";
import Loader from "../../components/common/Loader";
import { getShipmentQr } from "../../api/shipmentApi";
import { useLanguage } from "../../context/LanguageContext";

export default function ShipmentQrScreen({navigation,route}) {
  const {t}=useLanguage();
  const [data,setData]=useState(null),[error,setError]=useState(null);
  useEffect(()=>{getShipmentQr(route.params?.shipmentId).then(setData).catch(setError)},[route.params?.shipmentId]);
  if(!data&&!error)return <Loader text={t("shipment_qr_generating")}/>;
  return <View style={styles.screen}><TopBar title={t("shipment_qr_title")} navigation={navigation}/><ScrollView contentContainerStyle={styles.content}>{error?<Text style={styles.err}>{error.message}</Text>:<><Text style={styles.id}>{data.shipmentId}</Text><Text style={styles.tracking}>{data.trackingId}</Text>{data.qrDataUrl?<Image source={{uri:data.qrDataUrl}} style={styles.qr}/>:null}<Text style={styles.url}>{data.traceUrl}</Text><Text style={styles.note}>{t("shipment_qr_note")}</Text></>}</ScrollView></View>
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:22,alignItems:"center"},id:{fontFamily:"Manrope_800ExtraBold",fontSize:18,color:COLORS.text},tracking:{fontFamily:"Inter_600SemiBold",fontSize:12,color:COLORS.muted,marginTop:4},qr:{width:260,height:260,marginVertical:22,borderRadius:12},url:{fontFamily:"Inter_400Regular",fontSize:11,color:COLORS.blue,textAlign:"center"},note:{fontFamily:"Inter_400Regular",fontSize:11.5,lineHeight:18,color:COLORS.muted,textAlign:"center",marginTop:16},err:{fontFamily:"Inter_600SemiBold",color:COLORS.critical,textAlign:"center"}})