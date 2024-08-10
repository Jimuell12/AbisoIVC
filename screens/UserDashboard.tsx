import { View, Text, Image, TouchableOpacity, Alert, Modal } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Entypo } from '@expo/vector-icons';
import { auth, db } from '../utils/firebaseConfig';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { equalTo, get, onValue, query, ref, remove, set } from 'firebase/database';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons, AntDesign, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import ImageSlider from '../components/imageSlider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';

Mapbox.setAccessToken('pk.eyJ1IjoiYWJpc29pdmMiLCJhIjoiY2x5eDh0Z2k0MDcwNTJrcHN0aXl1anA2MiJ9.S94O4y8MKnzyyH7dS_thFw');

export default function UserDashboard() {
  const images = [
    {
      uri: 'https://www.earthquakecountry.org/library/SevenSteps_Step1_BlueOrange_RGB.png',
      text: `Secure your space by identifying hazards and securing moveable items.`,
    },
    {
      uri: 'https://www.earthquakecountry.org/library/SevenSteps_Step2_BlueOrange_RGB.png',
      text: `Plan to be safe by creating your emergency plan and deciding how you will communicate.`,
    },
    {
      uri: 'https://www.earthquakecountry.org/library/SevenSteps_Step3_BlueOrange_RGB.png',
      text: `Organize emergency supplies in convenient locations.`,
    },
    {
      uri: 'https://www.earthquakecountry.org/library/SevenSteps_Step4_BlueOrange_RGB.png',
      text: `Minimize financial hardship by organizing important documents, strengthening your property, and considering insurance coverage.`,
    },
    {
      uri: 'https://www.earthquakecountry.org/library/SevenSteps_Step5_BlueOrange_RGB.png',
      text: `Drop, Cover, and Hold On or other recommended actions such as Lock (wheels), Cover, and Hold On – if you feel shaking or get an alert.`,
    },
    {
      uri: 'https://www.earthquakecountry.org/library/SevenSteps_Step6_BlueOrange_RGB.png',
      text: `Improve safety after disaster by evacuating if necessary, helping the injured, and preventing further injuries or damage.`,
    },
    {
      uri: 'https://www.earthquakecountry.org/library/SevenSteps_Step7_BlueOrange_RGB.png',
      text: `Reconnect and Restore daily life by reuniting with others, repairing damage, and rebuilding community.`
    }
  ];
  const [messageCount, setMessageCount] = useState(0);

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState(require('../assets/images/profile2.jpg'));
  const navigation = useNavigation();
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [incident, setIncident] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [messageVisible, setMessageVisible] = useState(false);
  const [rescuerLocations, setRescuerLocations] = useState([]);
  const [rescuerIds, setRescuerIds] = useState([]);
  const [incidentId, setIncidentId] = useState('');


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

  useEffect(() => {
    const currentUserUid = auth.currentUser?.uid;

    if (currentUserUid) {
      const incidentsRef = ref(db, 'incidents');

      const handleIncidentsUpdate = (snapshot: any) => {
        if (snapshot.exists()) {
          let check = false;
          snapshot.forEach((uuidSnapshot: any) => {
            const uuid = uuidSnapshot.key;
            const incidentData = uuidSnapshot.val();

            if (incidentData.reportedBy === currentUserUid && incidentData.status === 'pending') {
              check = true;
              const numberOfRescuers = incidentData.numberofRescuer || 0;
              setModalVisible(true)
              setIncident(incidentData.type);
              setMessageVisible(true);

              // If there are no rescuers, set a timeout to delete the incident
              if (numberOfRescuers === 0) {
                clearInterval(intervalRef.current!); // Clear any existing intervals

                intervalRef.current = setInterval(() => {
                  setModalVisible(false);
                  setIncident('');
                  setMessageVisible(false);
                  remove(ref(db, `incidents/${uuid}`))
                    .then(() => {
                      Alert.alert('Rescue Unavailable', 'No available rescuers at the moment.');
                      check = false;
                      clearInterval(intervalRef.current!);  
                    })
                    .catch((error) => {
                      console.error('Error deleting incident:', error);
                    });
                }, 10000); // Check every 10 seconds
              } else if (numberOfRescuers > 0) {
                clearInterval(intervalRef.current!);
                setModalVisible(false);
                const rescuers = incidentData.rescuers || [];
                const rescuerArray: any = Object.keys(rescuers).map(uid => rescuers[uid]);
                setRescuerLocations(rescuerArray);
                setIncidentId(uuid);
              }
            } else if(incidentData.reportedBy === currentUserUid && incidentData.status === 'resolved' && !check) {
              setRescuerLocations([]);
              setIncident('');
              setMessageVisible(false);
              return;
            }
          });
        } else {
          clearInterval(intervalRef.current!);
        }

      };

      const unsubscribe = onValue(incidentsRef, handleIncidentsUpdate);

      return () => {
        unsubscribe();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, []);




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
  const settings = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Settings',
      })
    );
  }

  const handelIncidents = (incidentType: string) => {
    setIncident(incidentType);
    setModalVisible(true);
    const uuid = Math.random().toString(36).substring(7);
    const incidentRef = ref(db, 'incidents/' + uuid);
    set(incidentRef, {
      type: incidentType,
      location: {
        latitude: location?.latitude,
        longitude: location?.longitude
      },
      reportedBy: auth.currentUser?.uid,
      status: 'pending',
      numberofRescuer: 0,
      timestamp: Date.now()
    }).then(() => {
      console.log('Success', 'Incident reported successfully)');
    })
  }

  return (
    <SafeAreaView className='flex-1 p-2 bg-white'>
      <StatusBar translucent backgroundColor='transparent' />
      <View className='flex-row justify-between items-center px-2 py-4'>
        <View className='flex-row items-center'>
          <Image className='rounded-full w-12 h-12' source={require('../assets/images/abiso_logo.png')}>
          </Image>
          <Text className='text-xl font-bold text-[#3685cd]'>Abiso IVC</Text>
        </View>
        <View className='flex-row items-center gap-2'>
          <TouchableOpacity className='border border-gray-300 h-10 w-10 rounded-full overflow-hidden' onPress={settings}>
            <Image className='w-full h-full' source={imageUrl}></Image>
          </TouchableOpacity>
          <TouchableOpacity className='border border-gray-300 h-10 w-10 p-2 rounded-full items-center justify-center' onPress={logout}>
            <Entypo name="dots-three-horizontal" size={17} color="black" />
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
                centerCoordinate={[location.longitude, location.latitude]}
                followZoomLevel={16}
                animationMode='flyTo'
                animationDuration={2000}
              />

            ) : null}
            <Mapbox.LocationPuck
              puckBearingEnabled={true}
              puckBearing="heading"
              pulsing={{ isEnabled: true, color: '#FF5733', radius: 200 }}
            />
            {rescuerLocations.map((rescueLocation : any, index) => (
              <Mapbox.MarkerView
                key={rescueLocation.id}
                allowOverlap={true}
                allowOverlapWithPuck={true}
                coordinate={[rescueLocation.location.longitude, rescueLocation.location.latitude]}
              >
                <TouchableOpacity>
                  <LottieView
                    autoPlay
                    style={{
                      width: 75,
                      height: 75,
                    }}
                    source={require('../assets/animations/car.json')}
                  />
                </TouchableOpacity>
              </Mapbox.MarkerView>
            ))}
          </Mapbox.MapView>
          <TouchableOpacity
            className='absolute top-2 right-2 bg-white p-2 rounded-full'
            onPress={() => setFollowUserLocation(true)}
          >
            <Ionicons name="locate" size={24} color="black" />
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
              <AntDesign name="message1" size={24} color="black" />
              {messageCount > 0 && (
                <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 justify-center items-center">
                  <Text className="text-white text-xs">{messageCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}

          {!incident ? (
            <View className='absolute bottom-0 rounded-xl w-[97%] bg-white h-85 p-4 mb-2 mx-auto'>
              <Text className='text-sm text-gray-400'>Report Incident</Text>
              <View className='border-gray-200 border-b mx-2 my-2' />
              <View className='flex-row items-center w-full gap-3 mb-2 px-2'>
                <View className='p-3 w-12 items-center bg-[#cce5ff] rounded-xl'>
                  <FontAwesome6 name="house-flood-water" size={20} color="#339af0" />
                </View>
                <TouchableOpacity className='bg-[#cce5ff] p-3 flex-1 rounded-xl items-center shadow-md justify-center mt-2' onPress={() => handelIncidents("flood")}>
                  <Text className='text-[#339af0]'>Flood</Text>
                </TouchableOpacity>
              </View>
              <View className='flex-row items-center w-full gap-3 mb-2 px-2'>
                <View className='p-3 w-12 items-center bg-[#ffccd5] rounded-xl'>
                  <FontAwesome6 name="house-fire" size={20} color="#ff5252" />
                </View>
                <TouchableOpacity className='bg-[#ffccd5] p-3 flex-1 rounded-xl shadow-md items-center justify-center mt-2' onPress={() => handelIncidents("fire")}>
                  <Text className='text-[#ff5252]'>Fire</Text>
                </TouchableOpacity>
              </View>
              <View className='flex-row items-center w-full gap-3 mb-2 px-2'>
                <View className='p-3 w-12 items-center bg-[#e4d8c3] rounded-xl'>
                  <FontAwesome5 name="house-damage" size={20} color="#8d5524" />
                </View>
                <TouchableOpacity className='bg-[#e4d8c3] p-3 flex-1 rounded-xl shadow-md items-center justify-center mt-2' onPress={() => handelIncidents("earthquake")}>
                  <Text className='text-[#8d5524]'>Earthquake</Text>
                </TouchableOpacity>
              </View>
              <View className='flex-row items-center w-full gap-3 mb-2 px-2'>
                <View className='p-3 w-12 items-center bg-[#1f1f1f6e] rounded-xl'>
                  <FontAwesome5 name="skull-crossbones" size={20} color="#1f1f1f" />
                </View>
                <TouchableOpacity className='bg-[#1f1f1f6e] p-3 flex-1 rounded-xl shadow-md items-center justify-center mt-2' onPress={() => handelIncidents("manmade")}>
                  <Text className='text-[#1f1f1f]'>Man Made</Text>
                </TouchableOpacity>
              </View>
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className='flex-row items-center gap-2'>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={30} color="white" />
            <Text className='text-white font-bold text-2xl'>TIPS</Text>
          </View>
          <View className='p-2 rounded-lg  bg-white mt-4'>
            <ImageSlider images={images} />
          </View>
          <View className='p-2 rounded-lg w-80 flex-row items-center justify-start'>
            <LottieView
              source={require('../assets/animations/loading.json')}
              autoPlay
              loop
              style={{ width: 70, height: 70 }}
            />
            <Text className='text-xl font-bold text-white'>Waiting for rescuer...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
} 