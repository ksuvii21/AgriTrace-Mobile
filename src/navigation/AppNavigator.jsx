import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/splash/SplashScreen";
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import BottomTabs from "./BottomTabs";
import ShipmentDetailsScreen from "../screens/shipments/ShipmentDetailsScreen";
import ShipmentQrScreen from "../screens/shipments/ShipmentQrScreen";
import DevicesScreen from "../screens/devices/DevicesScreen";
import DeviceDetailsScreen from "../screens/devices/DeviceDetailsScreen";
import AssignDeviceScreen from "../screens/devices/AssignDeviceScreen";
import LiveMonitoringScreen from "../screens/monitoring/LiveMonitoringScreen";
import TraceabilityScreen from "../screens/traceability/TraceabilityScreen";

const Stack=createNativeStackNavigator();
export default function AppNavigator(){
  return <NavigationContainer><Stack.Navigator initialRouteName="Splash" screenOptions={{headerShown:false,animation:"fade_from_bottom",contentStyle:{backgroundColor:"#F5F9F7"}}}><Stack.Screen name="Splash" component={SplashScreen} options={{animation:"fade"}}/><Stack.Screen name="Onboarding" component={OnboardingScreen}/><Stack.Screen name="Login" component={LoginScreen}/><Stack.Screen name="Register" component={RegisterScreen}/><Stack.Screen name="MainTabs" component={BottomTabs} options={{gestureEnabled:false}}/><Stack.Screen name="ShipmentDetails" component={ShipmentDetailsScreen}/><Stack.Screen name="ShipmentQr" component={ShipmentQrScreen}/><Stack.Screen name="Devices" component={DevicesScreen}/><Stack.Screen name="DeviceDetails" component={DeviceDetailsScreen}/><Stack.Screen name="AssignDevice" component={AssignDeviceScreen}/><Stack.Screen name="LiveMonitoring" component={LiveMonitoringScreen}/><Stack.Screen name="Traceability" component={TraceabilityScreen}/></Stack.Navigator></NavigationContainer>
}
