import React, { useEffect, useState } from 'react'
import { Alert, Text, View, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth, db } from '../utils/firebaseConfig';
import * as Location from 'expo-location';
import { Entypo } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { get, ref, set } from 'firebase/database'
import { directions, reverseGeocode } from '../utils/api';

Mapbox.setAccessToken('pk.eyJ1IjoiYWJpc29pdmMiLCJhIjoiY2x5eDh0Z2k0MDcwNTJrcHN0aXl1anA2MiJ9.S94O4y8MKnzyyH7dS_thFw');

export default function Dashboard() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState(require('../assets/images/profile.jpg'));
  const [routeGeoJson, setRouteGeoJson] = useState<any>();
  const navigation = useNavigation();
  const [distance, setDistance] = useState(0);
  const [travelTime, setTravelTime] = useState(0);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      // Start watching the user's location
      const subscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // Update every meter
          timeInterval: 5000, // Update every 5 seconds
        },
        (newLocation) => {
          setLocation(newLocation.coords);
          // Update the route based on the new location
          updateRoute(newLocation.coords);
        }
      );

      return () => {
        subscription.then((sub) => sub.remove()); // Cleanup on unmount
      };
    };

    const updateUserDetails = async () => {
      if (auth.currentUser) {
        const userRef = ref(db, 'users/' + auth.currentUser.uid);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const name = snapshot.val().name;
            const imageUrl = snapshot.val().imageUrl;

            setName(name);
            if (imageUrl) {
              setImageUrl({ uri: imageUrl });
            }
          } else {
            console.log('No data available');
          }
        }).catch((error) => {
          console.error(error);
        });
      }
    };

    requestLocationPermission();
    updateUserDetails();
  }, []);

  const updateRoute = async (coords: Location.LocationObjectCoords) => {
    // Replace with your destination coordinates
    const destination = '121.0892689,14.6219004';
    const locationName = await reverseGeocode(121.0892689, 14.6219004);
    setLocationName(locationName.features[0].properties.name);
    const response = await directions(`${coords.longitude},${coords.latitude}`, destination);
    const geometry = extractRouteGeometry(await response);
    setRouteGeoJson(geometry);
  };

  const extractRouteGeometry = (response: any) => {
    if (response.routes && response.routes.length > 0) {
      const route = response.routes[0]; // Take the first route
      const coordinates = route.geometry.coordinates; // Extract coordinates
      setDistance(response.routes[0].distance);
      setTravelTime(response.routes[0].duration);
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
      };
    }
    return null;
  };

  const logout = () => {
    auth.signOut().then(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    });
  };

  return (
    <SafeAreaView className='flex-1 p-2 bg-white'>
      <View className='flex-row justify-between items-center px-2 py-4'>
        <View className='flex-row items-center'>
          <Image className='rounded-full w-12 h-12' source={require('../assets/images/abiso_logo2.png')}>
          </Image>
          <Text className='text-xl font-bold text-black'>Abiso IVC</Text>
        </View>
        <View className='flex-row items-center gap-2'>
          <TouchableOpacity className='w-12 h-12 rounded-full'>
            <Image className='w-full h-full' source={imageUrl}></Image>
          </TouchableOpacity>
          <TouchableOpacity className='border border-gray-300 p-2 rounded-full' onPress={logout}>
            <Entypo name="dots-three-horizontal" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      {location ? (
        <View className='flex-1 rounded-3xl my-4 justify-center items-center relative overflow-hidden drop-shadow-xl shadow-black'>
          <Mapbox.MapView 
              attributionEnabled={false}
              compassEnabled={true}
              logoEnabled={false}
              scaleBarEnabled={false}
              className='w-full h-full'>
            <Mapbox.Camera
              zoomLevel={16}
              followUserLocation={true}
              followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
              centerCoordinate={[location.longitude, location.latitude]}
              followZoomLevel={16}
              animationMode='flyTo'
              animationDuration={0}
            />
            <Mapbox.LocationPuck
              puckBearingEnabled={true}
              puckBearing="heading"
              pulsing={{ isEnabled: true, color: '#FF5733', radius: 50 }} 
            />
            {routeGeoJson ? (
              <Mapbox.ShapeSource id="routeSource" shape={routeGeoJson}>
                <Mapbox.LineLayer
                  id="routeLayer"
                  style={{
                    lineColor: '#007cbf',
                    lineWidth: 5,
                  }}
                />  
              </Mapbox.ShapeSource>
            ) : null}
          </Mapbox.MapView>
          <TouchableOpacity
            className='absolute top-2 left-2 bg-white p-2 rounded-full'

          >
            <Ionicons name="locate" size={24} color="black" />
          </TouchableOpacity>
          <View className='absolute bottom-0 rounded-xl w-[97%] bg-white h-85 p-4 mb-2 mx-auto'>
            <Text className='text-sm text-gray-400'>Incident Details</Text>
            <Text className='text-base font-semibold'>{locationName}</Text>
            <View className='border-gray-200 border-b mx-2 my-2' />
            <View className='flex-col justify-between gap-1'>
              <View className='flex-row items-center space-x-2 rounded-full'>
                <View className='p-2 bg-gray-100 rounded-full'><Ionicons name="flame" size={20} color="black" /></View>
                <Text>Fire Incident</Text>
              </View>
              <View className='flex-row items-center space-x-2 rounded-full'>
                <View className='p-2 bg-gray-100 rounded-full'><Entypo name="location-pin" size={18} color="black" /></View>
                <Text>{(distance / 1000).toFixed(2)} km</Text>
                <Text
                  className={`${
                    travelTime > 1800
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}
                >
                  ({(travelTime / 60).toFixed(2)} mins)
                </Text>
              </View> 
              <View className='flex-row items-center space-x-2 rounded-full'>
                <View className='p-2 bg-gray-100 rounded-full'><Entypo name="clock" size={18} color="black" /></View>
                <Text>10:00 AM</Text>
              </View>
              <View className='flex-row items-center space-x-2 rounded-full'>
              <View className='p-2 bg-gray-100 rounded-full'><Entypo name="user" size={18} color="black" /></View>
                <Text>Jimuel Flojera</Text>
              </View>
              <View className='flex-row items-center space-x-2 rounded-full'>
                <View className='p-2 bg-gray-100 rounded-full'><Entypo name="phone" size={18} color="black" /></View>
                <Text>08012345678</Text>
              </View>
            </View>
            <View className='flex-1 flex-row justify-between space-x-1'>
              <TouchableOpacity className='bg-[#1f1f1f] border-white border rounded-lg mt-3 p-2 w-1/2 items-center justify-center'>
                <Text className='text-white'>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity className='bg-white border-black border rounded-lg mt-3 p-2 w-1/2 items-center justify-center'>
                <Text className='text-black'>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View className='flex-1 justify-center items-center'>
          <Text>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  )
}
