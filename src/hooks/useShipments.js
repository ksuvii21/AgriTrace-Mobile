import { useCallback, useEffect, useState } from "react";
import { getShipments } from "../api/shipmentApi";
import { normalizeShipment } from "../utils/apiMappers";

export default function useShipments() {
  const [shipments,setShipments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  const refresh=useCallback(async()=>{
    try{
      setLoading(true);setError(null);
      const docs=await getShipments();
      setShipments((docs||[]).map(doc=>normalizeShipment(doc)));
    }catch(e){setError(e);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{refresh()},[refresh]);

  return {shipments,loading,error,refresh};
}
