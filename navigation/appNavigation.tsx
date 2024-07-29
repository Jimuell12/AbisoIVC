import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/Login';
import OnBoarding from '../screens/OnBoarding';
import { getData } from '../utils/asyncStorage';
import Register from '../screens/Register';
import Dashboard from '../screens/Dashboard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../utils/firebaseConfig';
import UserDashboard from '../screens/UserDashboard';
import Settings from '../screens/Settings';
import { get, ref } from 'firebase/database';

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  const [initialRouteName, setInitialRouteName] = useState<string | undefined>(undefined);
  useEffect(() => {

    checkInitialRoute();
  }, []);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userRef = ref(db, 'users/' + user.uid);
      get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
              const role = snapshot.val().role;
              if(role === "user") {
                setInitialRouteName('UserDashboard');
              } else {
                setInitialRouteName('Dashboard');
              }
            }
          }
        );
    } else {
      setInitialRouteName('OnBoarding');
    }
  });

  const checkInitialRoute = async () => {
    const onboarded = await getData('onboarded');
    if (!onboarded) {
      setInitialRouteName('OnBoarding');
    }
  };

  if (initialRouteName === undefined) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen name="OnBoarding" options={{ headerShown: false }} component={OnBoarding} />
        <Stack.Screen name="Login" options={{ headerShown: false }} component={Login} />
        <Stack.Screen name="Register" options={{ headerShown: false }} component={Register} />
        <Stack.Screen name="Dashboard" options={{ headerShown: false }} component={Dashboard} />
        <Stack.Screen name="UserDashboard" options={{ headerShown: false }} component={UserDashboard} />
        <Stack.Screen name="Settings" options={{ headerShown: false }} component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
