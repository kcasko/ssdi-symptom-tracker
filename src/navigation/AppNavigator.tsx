/**
 * App Navigator
 * Main navigation configuration for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  OnboardingScreen,
  ProfilePickerScreen,
  ProfileCreationScreen,
  DashboardScreen,
  DailyLogScreen,
  ActivityLogScreen,
  LimitationsScreen,
  MedsAppointmentsScreen,
  ReportsScreen,
  ReportEditorScreen,
  SettingsScreen,
  TrendsScreen,
  AboutScreen,
} from '../screens';

// Type definitions
export type RootStackParamList = {
  Onboarding: undefined;
  ProfilePicker: undefined;
  ProfileCreation: undefined;
  Dashboard: undefined;
  DailyLog: undefined;
  ActivityLog: undefined;
  Limitations: undefined;
  MedsAppointments: undefined;
  Reports: undefined;
  ReportEditor: { reportId: string };
  Settings: undefined;
  Trends: undefined;
  VoiceLog: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isFirstLaunch: boolean;
}

export function AppNavigator({ isFirstLaunch }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isFirstLaunch ? "Onboarding" : "ProfilePicker"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="ProfilePicker" component={ProfilePickerScreen} />
        <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="DailyLog" component={DailyLogScreen} />
        <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
        <Stack.Screen name="Limitations" component={LimitationsScreen} />
        <Stack.Screen name="MedsAppointments" component={MedsAppointmentsScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="ReportEditor" component={ReportEditorScreen} />
        <Stack.Screen name="Trends" component={TrendsScreen} />
        <Stack.Screen 
          name="VoiceLog" 
          getComponent={() => require('../screens/VoiceLogScreen').VoiceLogScreen}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}