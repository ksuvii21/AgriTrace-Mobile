import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import COLORS from "../../constants/colors";
import AlertCard from "../../components/alerts/AlertCard";
import AlertSeverityBadge from "../../components/alerts/AlertSeverityBadge";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { getAlerts, acknowledgeAlert } from "../../api/alertApi";
import { normalizeAlert } from "../../utils/apiMappers";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { useAlerts } from "../../context/AlertContext";
import { ALERT_STATUS } from "../../services/alertService";

const FILTERS = ["all", "Critical", "Warning", "Device", "Resolved"];

export default function AlertsScreen({navigation}) {
  const {role}=useAuth();
  const {t}=useLanguage();
  const {history,refreshHistory,triggerTestCriticalAlert}=useAlerts();
  const [filter,setFilter]=useState("all");
  const [remote,setRemote]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  const load=useCallback(async()=>{
    try{
      setError(null);
      const result=await getAlerts({page:1,limit:100});
      setRemote((result?.alerts||[]).map(normalizeAlert));
      // Local critical alerts are the authoritative emergency record.
      await refreshHistory();
    }catch(e){
      setError(e);
    }finally{
      setLoading(false);
    }
  },[refreshHistory]);

  useEffect(()=>{load()},[load]);

  /**
   * Merge locally-tracked critical alerts (which carry ack status and
   * live readings) with the backend feed, de-duplicated by id.
   * Local records win so ACKNOWLEDGED status is never overwritten.
   */
  const merged=useMemo(()=>{
    const byId=new Map();

    (remote||[]).forEach(a=>{byId.set(a.id,a)});

    (history||[]).forEach(local=>{
      const existing=byId.get(local.id);
      byId.set(local.id,{
        id:local.id,
        severity:"Critical",
        type:"Environmental",
        title:local.title||t("alert_critical_gas_title"),
        shipment:local.shipmentName||local.shipmentId||local.deviceId||"—",
        detail:local.message,
        gasLevel:local.gasLevel,
        time:local.occurredAt,
        status:local.status,
        resolved:local.status===ALERT_STATUS.ACKNOWLEDGED,
        raw:existing?.raw||local,
        local,
      });
    });

    return Array.from(byId.values());
  },[remote,history,t]);

  const list=useMemo(()=>{
    if(filter==="Resolved")return merged.filter(a=>a.resolved);
    if(filter==="all")return merged;
    return merged.filter(a=>a.severity===filter&&!a.resolved);
  },[merged,filter]);

  if(loading)return <Loader text={t("alerts_loading")}/>;

  const openDetails=a=>navigation.navigate("AlertDetails",{alertId:a.id,alert:a.local});

  const view=a=>{
    if(a.raw?.shipmentId)navigation.navigate("ShipmentDetails",{shipmentId:a.raw.shipmentId});
    else if(a.raw?.deviceId)navigation.navigate("DeviceDetails",{deviceId:a.raw.deviceId});
  };

  const ack=async a=>{
    if(role!=="ADMIN"){Alert.alert(t("alerts_admin_action_title"),t("alerts_admin_action_body"));return}
    try{
      await acknowledgeAlert(a.id);
      await load();
    }catch(e){
      Alert.alert(t("alerts_ack_failed"),e.message);
    }
  };

  const test=async()=>{
    const result=await triggerTestCriticalAlert({deviceId:"AGRITRACE-001",gasLevel:4127});
    // Backend path returns { action: "created"|"refreshed"|"skipped_cooldown" };
    // the local fallback returns { action: "opened" }.
    if(result?.action)await load();
  };

  const filterLabels={all:"alerts_filter_all",Critical:"alerts_filter_critical",Warning:"alerts_filter_warning",Device:"alerts_filter_device",Resolved:"alerts_filter_resolved"};

  return <View style={styles.screen}><View style={styles.top}><Text style={styles.title}>{t("alerts_title")}</Text><AlertSeverityBadge severity="CRITICAL" compact/></View><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={load}/>}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{FILTERS.map(f=><TouchableOpacity key={f} onPress={()=>setFilter(f)} style={[styles.tab,filter===f&&styles.active]}><Text style={[styles.tabText,filter===f&&styles.activeText]}>{t(filterLabels[f])}</Text></TouchableOpacity>)}</ScrollView>{error?<Text style={styles.err}>{error.message}</Text>:null}{list.length===0?<EmptyState title={t("alerts_empty_title")} message={t("alerts_empty_message")}/>:null}{list.map(a=><AlertCard key={a.id} alert={a} onPress={()=>openDetails(a)} onView={()=>view(a)} onAcknowledge={()=>ack(a)}/>)}</ScrollView>{__DEV__?<TouchableOpacity style={styles.dev} onPress={test}><Text style={styles.devText}>{t("alerts_dev_test")}</Text></TouchableOpacity>:null}</View>
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  top:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:18,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border},
  title:{fontFamily:"Manrope_800ExtraBold",fontSize:16,color:COLORS.text},
  content:{padding:18,paddingBottom:105},
  tabs:{gap:8,marginBottom:16},
  tab:{paddingHorizontal:16,paddingVertical:9,borderRadius:99,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border},
  active:{backgroundColor:COLORS.green,borderColor:COLORS.green},
  tabText:{fontFamily:"Inter_700Bold",fontSize:12,color:COLORS.muted},
  activeText:{color:COLORS.white},
  err:{fontFamily:"Inter_500Medium",fontSize:12,color:COLORS.critical,marginBottom:10},
  dev:{position:"absolute",right:16,bottom:96,paddingHorizontal:12,paddingVertical:8,borderRadius:10,backgroundColor:"rgba(0,0,0,0.78)"},
  devText:{fontFamily:"Inter_600SemiBold",fontSize:11,color:"#7BE3AF"},
})