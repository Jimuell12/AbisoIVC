import React, { useEffect, useState } from 'react'
import { Alert, Text, View, Image, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth, db } from '../utils/firebaseConfig';
import * as Location from 'expo-location';
import { Entypo, FontAwesome6, Ionicons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { CommonActions, Link, useNavigation } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { get, onValue, ref, set } from 'firebase/database'
import { directions, reverseGeocode } from '../utils/api';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';

Mapbox.setAccessToken('pk.eyJ1IjoiYWJpc29pdmMiLCJhIjoiY2x5eDh0Z2k0MDcwNTJrcHN0aXl1anA2MiJ9.S94O4y8MKnzyyH7dS_thFw');

export default function Dashboard() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [imageUrl, setImageUrl] = useState(require('../assets/images/profile2.jpg'));
  const [routeGeoJson, setRouteGeoJson] = useState<any>();
  const navigation = useNavigation();
  const [destination, setDestination] = useState('121.0892689,14.6219004');
  const [distance, setDistance] = useState(0);
  const [travelTime, setTravelTime] = useState(0);
  const [locationName, setLocationName] = useState('');
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [incident, setIncident] = useState([]);
  const [incidentType, setIncidentType] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [incidentId, setIncidentId] = useState('');
  const [incidentVisible, setIncidentVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleView = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      const subscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
          timeInterval: 5000,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
        }
      );

      return () => {
        subscription.then((sub) => sub.remove());
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

  useEffect(() => {
    if (location) {
      const incidentsRef = ref(db, 'incidents');
      const handleIncidentsUpdate = (snapshot: any) => {
        if (snapshot.exists()) {
          let check = false;
          snapshot.forEach(async (uuidSnapshot: any) => {
            const incident = uuidSnapshot.val();
            const rescuers = incident.rescuers || {};
            const isCurrentUserInRescuers = Object.values(rescuers).flat().some((rescuer: any) => rescuer.id === auth.currentUser?.uid);

            if (isCurrentUserInRescuers && incident.status === 'pending') {
              check = true
              const incidentsArray: any = Object.keys(snapshot.val()).map((key) => snapshot.val()[key]);
              const datetime = new Date(incident.timestamp);
              const userUid = incident.reportedBy;
              const userRef = ref(db, 'users/' + userUid);
              const userSnapshot = await get(userRef);
              const userName = userSnapshot.val().name;
              const userMobile = userSnapshot.val().mobile;
              const userEmail = userSnapshot.val().email;
              const messagesCont = incident.messages ? Object.keys(incident.messages).length : 0;

              setIncidentVisible(true);
              updateRoute(location!, incident.location);
              setIncident(incidentsArray);
              setMessageCount(messagesCont);
              setName(userName);
              setMobile(userMobile);
              setEmail(userEmail);
              setIncidentType(incident.type);
              setIncidentTime(datetime.toLocaleString());
              setMessageVisible(true);
              setIncidentId(uuidSnapshot.key);
              setDestination(`${incident.location.longitude},${incident.location.latitude}`);
            } else if (isCurrentUserInRescuers && incident.status === 'resolved' && !check) {
              setMessageVisible(false);
              setDestination('');
              setIncident([]);
              setIncidentType('');
              setIncidentTime('');
              setMobile('');
              setName('');
              setEmail('');
              setMessageCount(0);
              setIncidentId('');
            }
          });
        } else {
          console.log('No data available');
        }
      };

      const unsubscribe = onValue(incidentsRef, handleIncidentsUpdate);

      return () => {
        unsubscribe();
      };
    }
  }, [location]);

  const updateRoute = async (coords: Location.LocationObjectCoords, incidentLocation: Location.LocationObjectCoords) => {
    // Replace with your destination coordinates
    const currentLocation = `${coords.longitude},${coords.latitude}`;
    const destination = `${incidentLocation.longitude},${incidentLocation.latitude}`;
    const locationName = await reverseGeocode(incidentLocation.longitude, incidentLocation.latitude);
    setLocationName(locationName.features[0].properties.full_address);
    const response = await directions(currentLocation, destination);
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

  const settings = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Settings',
      })
    );
  }


  return (
    <SafeAreaView className='flex-1 p-2 bg-slate-100'>
      <StatusBar translucent backgroundColor='transparent' />
      <View className='flex-row justify-between items-center px-2 py-4'>
        <TouchableOpacity className='flex-row items-center' onPress={() => { Linking.openURL('https://www.facebook.com/BrgyIVC'); }}>
          <Image className='rounded-full w-12 h-12' source={require('../assets/images/abiso_logo.png')}>
          </Image>
          <Text className='text-xl font-bold text-[#3685cd]'>Abiso IVC</Text>
        </TouchableOpacity>
        <View className='flex-row items-center gap-2'>
          <TouchableOpacity className='border border-[#3685cd] h-10 w-10 rounded-full overflow-hidden' onPress={settings}>
            <Image className='w-full h-full' source={imageUrl}></Image>
          </TouchableOpacity>
        </View>
      </View>
      {location ? (
        <View className='flex-1 rounded-3xl my-4 justify-center items-center relative overflow-hidden drop-shadow-xl shadow-black'>
          <Mapbox.MapView
            attributionEnabled={false}
            compassEnabled={false}
            logoEnabled={false}
            scaleBarEnabled={false}
            className='w-full h-full'
            onTouchMove={() => setFollowUserLocation(false)}
          >
            {followUserLocation ? (
              <Mapbox.Camera
                zoomLevel={16}
                followUserLocation={true}
                followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
                centerCoordinate={[location.longitude, location.latitude]}
                followZoomLevel={16}
                animationMode='flyTo'
                animationDuration={0}
              />

            ) : null}
            <Mapbox.LocationPuck
              puckBearingEnabled={true}
              puckBearing="heading"
              pulsing={{ isEnabled: true, color: '#3685cd', radius: 20 }}
            />
            {routeGeoJson ? (
              <Mapbox.ShapeSource id="routeSource" shape={routeGeoJson}>
                <Mapbox.LineLayer
                  id="routeLayer"
                  style={{
                    lineColor: '#FF5733',
                    lineWidth: 5,
                  }}
                />
              </Mapbox.ShapeSource>
            ) : null}
            {incident.map((incidentDetails: any, index) => (
              <Mapbox.MarkerView
                key={incidentDetails.timestamp}
                allowOverlap={true}
                allowOverlapWithPuck={true}
                coordinate={[incidentDetails.location.longitude, incidentDetails.location.latitude]}
              >
                <TouchableOpacity onPress={() => {

                }}>
                  {incidentDetails.type === 'fire' ? (<LottieView
                    autoPlay
                    style={{
                      width: 75,
                      height: 75,
                    }}
                    source={require(`../assets/animations/fire.json`)}
                  />) : null}
                  {incidentDetails.type === 'flood' ? (<LottieView
                    autoPlay
                    style={{
                      width: 75,
                      height: 75,
                    }}
                    source={require(`../assets/animations/flood.json`)}
                  />) : null}
                  {incidentDetails.type === 'earthquake' ? (<LottieView
                    autoPlay
                    style={{
                      width: 75,
                      height: 75,
                    }}
                    source={require(`../assets/animations/earthquake.json`)}
                  />) : null}
                  {incidentDetails.type === 'manmade' ? (<LottieView
                    autoPlay
                    style={{
                      width: 75,
                      height: 75,
                    }}
                    source={require(`../assets/animations/manmade.json`)}
                  />) : null}
                </TouchableOpacity>
              </Mapbox.MarkerView>
            ))}
          </Mapbox.MapView>
          <TouchableOpacity
            className='absolute top-2 right-2 bg-white p-2 rounded-full'
            onPress={() => setFollowUserLocation(true)}
          >
            <Ionicons name="locate" size={24} color="#3685cd" />
          </TouchableOpacity>
          {messageVisible ? (
            <TouchableOpacity
              className="absolute top-2 left-2 bg-white p-2 rounded-full"
              onPress={() => navigation.dispatch(
                CommonActions.navigate({
                  name: 'Messages',
                  params: { incidentId }
                })
              )}
            >
              <AntDesign name="message1" size={24} color="#3685cd" />
              {messageCount > 0 && (
                <View className="absolute top-0 right-0 bg-[#3685cd] rounded-full w-4 h-4 justify-center items-center">
                  <Text className="text-white text-xs">{messageCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}
          {incidentVisible ? (
            <View className={`absolute bottom-0 rounded-xl w-[97%] bg-white p-4 mb-2 mx-auto ${isMinimized ? 'h-30' : 'h-85'}`}>
              <TouchableOpacity onPress={toggleView} className="flex-row justify-between items-center">
                <Text className='text-sm text-gray-400'>{isMinimized ? 'Show Details' : 'Incident Details:'}</Text>
                <Ionicons name={isMinimized ? "chevron-up" : "chevron-down"} size={24} color="gray" />
              </TouchableOpacity>
              <Text className='text-base font-semibold text-[#3685cd]'>{locationName}</Text>

              {!isMinimized && (
                <>
                  <View className='border-gray-200 border-b mx-2 my-2' />
                  <View className='flex-col justify-between gap-1'>
                    <View className='flex-row items-center space-x-2 rounded-full'>
                      {incidentType === 'fire' && <View className='p-2 bg-[#ffccd5] rounded-full'><FontAwesome6 name="house-fire" size={17} color="#ff5252" /></View>}
                      {incidentType === 'flood' && <View className='p-2 bg-[#cce5ff] rounded-full'><FontAwesome6 name="house-flood-water" size={17} color="#339af0" /></View>}
                      {incidentType === 'earthquake' && <View className='p-2 bg-[#e4d8c3] rounded-full'><FontAwesome5 name="house-damage" size={17} color="#8d5524" /></View>}
                      {incidentType === 'manmade' && <View className='p-2 bg-[#1f1f1f6e] rounded-full'><Ionicons name="skull-outline" size={20} color="#1f1f1f" /></View>}
                      <Text className='font-semibold text-base'>{incidentType.charAt(0).toUpperCase() + incidentType.slice(1)} Incident</Text>
                    </View>
                    <View className='flex-row items-center space-x-2 rounded-full'>
                      <View className='p-2 bg-gray-100 rounded-full'>
                        <Entypo name="clock" size={18} color="black" />
                      </View>
                      <Text className='text-black'>{incidentTime}</Text>
                    </View>
                    <View className='flex-row items-center space-x-2 rounded-full'>
                      <View className='p-2 bg-gray-100 rounded-full'>
                        <Entypo name="user" size={18} color="black" />
                      </View>
                      <Text className='text-black'>{name}</Text>
                    </View>
                    <TouchableOpacity className='flex-row items-center space-x-2 rounded-full'>
                      <View className='p-2 bg-gray-100 rounded-full'><Entypo name="mail" size={18} color="black" /></View>
                      <Text onPress={() => { Linking.openURL(`mailto:${email}`); }}>{email}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='flex-row items-center space-x-2 rounded-full'>
                      <View className='p-2 bg-gray-100 rounded-full'><Entypo name="phone" size={18} color="black" /></View>
                      <Text onPress={() => { Linking.openURL(`tel:${mobile}`); }}>{mobile}</Text>
                    </TouchableOpacity>
                  </View>
                  <View className='flex-1 flex-row justify-between space-x-1'>
                    <TouchableOpacity className='bg-[#cce5ff] border border-[#339af0] rounded-lg mt-3 p-2 w-1/2 items-center justify-center'>
                      <Text className='text-[#339af0] font-semibold'>Resolved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='bg-white border-[#3685cd] border rounded-lg mt-3 p-2 w-1/2 items-center justify-center'>
                      <Text className='text-[#3685cd] font-semibold'>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ) : null}
        </View>

      ) : (
        <View className='flex-1 justify-center items-center'>
          <LottieView
            source={require('../assets/animations/loading.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
        </View>
      )}

    </SafeAreaView>
  )
}
