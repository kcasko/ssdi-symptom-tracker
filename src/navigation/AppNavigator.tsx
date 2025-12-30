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
  DashboardScreen,
  DailyLogScreen,
  ActivityLogScreen,
  LimitationsScreen,
  MedsAppointmentsScreen,
  ReportsScreen,
  ReportEditorScreen,
  SettingsScreen,
} from '../screens';

// Type definitions
export type RootStackParamList = {
  Onboarding: undefined;
  ProfilePicker: undefined;
  Dashboard: undefined;
  DailyLog: undefined;
  ActivityLog: undefined;
  Limitations: undefined;
  MedsAppointments: undefined;
  Reports: undefined;
  ReportEditor: { reportId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ProfilePicker"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="ProfilePicker" component={ProfilePickerScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="DailyLog" component={DailyLogScreen} />
        <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
        <Stack.Screen name="Limitations" component={LimitationsScreen} />
        <Stack.Screen name="MedsAppointments" component={MedsAppointmentsScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="ReportEditor" component={ReportEditorScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}