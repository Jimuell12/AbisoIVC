import { View, Text, Image, TouchableOpacity, Alert, Modal, Linking } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Entypo } from '@expo/vector-icons';
import { auth, db } from '../utils/firebaseConfig';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { equalTo, get, onValue, push, query, ref, remove, set, update } from 'firebase/database';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons, AntDesign, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import ImageSlider from '../components/imageSlider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';
import { reverseGeocode } from '../utils/api';

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
  const [userMobile, setUserMobile] = useState('');
  const cameraRef = useRef<Mapbox.Camera | null>(null);
  const [cameraCoordinates, setCameraCoordinates] = useState<[number, number]>([0, 0]);
  const [rescuerDetailsVisible, setRescuerDetailsVisible] = useState(false);
  const [rescuerDetails, setRescuerDetails] = useState({ name: '', imageUrl: '', mobile: '', email: '' });
  const [isMinimized, setIsMinimized] = useState(false);

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
          setCameraCoordinates([newLocation.coords.longitude, newLocation.coords.latitude]);
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
            const userMobile = snapshot.val().mobile;

            setName(name);
            setUserMobile(userMobile);
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
          snapshot.forEach((uuidSnapshot: any) => {
            const uuid = uuidSnapshot.key;
            const incidentData = uuidSnapshot.val();
      
            if (incidentData.reportedBy === currentUserUid) {
              if (incidentData.status === 'pending') {
                const numberOfRescuers = incidentData.numberofRescuer || 0;
                setModalVisible(true);
                setIncident(incidentData.type);
                setMessageVisible(true);
      
                if (numberOfRescuers === 0) {
                  clearInterval(intervalRef.current!);
      
                  intervalRef.current = setInterval(() => {
                    setModalVisible(false);
                    setIncident('');
                    setMessageVisible(false);
                    remove(ref(db, `incidents/${uuid}`))
                      .then(() => {
                        Alert.alert('Rescue Unavailable', 'No available rescuers at the moment.');
                      })
                      .catch((error) => {
                        console.error('Error deleting incident:', error);
                      });
                  }, 30000);
                } else if (numberOfRescuers > 0) {
                  clearInterval(intervalRef.current!);
                  setModalVisible(false);
                  setRescuerLocations([]);
                  const rescuers = incidentData.rescuers || [];
                  const rescuerArray: any = Object.keys(rescuers).map(uid => rescuers[uid]);
                  if (rescuerArray.length > 0) {
                    setRescuerLocations(rescuerArray);
                    setFollowUserLocation(false);
                    setCameraCoordinates([rescuerArray[0].location.longitude, rescuerArray[0].location.latitude]);
                    setFollowUserLocation(true);
                  }
                  setIncidentId(uuid);
                }
              } else if (incidentData.status === 'resolved' && !incidentData.alerted) {
                // Only alert if the incident is resolved and hasn't been alerted before
                setRescuerLocations([]);
                setIncident('');
                setMessageVisible(false);
                Alert.alert('Incident Resolved', 'Your previous incident request has been successfully resolved.');
      
                // Update the incident to mark it as alerted to avoid future alerts
                update(ref(db, `incidents/${uuid}`), { alerted: true });
              }
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

  const settings = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Settings',
      })
    );
  }

  const handelIncidents = async (incidentType: string) => {
    setIncident(incidentType);
    setModalVisible(true);
    const incidentRef = ref(db, 'incidents/');
    const locationName = await reverseGeocode(location?.longitude, location?.latitude);
    push(incidentRef, {
      type: incidentType,
      location: {
        latitude: location?.latitude,
        longitude: location?.longitude
      },
      userName: name,
      userMobile: userMobile,
      locationName: locationName.features[0].properties.full_address,
      userEmail: auth.currentUser?.email,
      reportedBy: auth.currentUser?.uid,
      status: 'pending',
      numberofRescuer: 0,
      timestamp: Date.now()
    }).then(() => {
      console.log('Success', 'Incident reported successfully)');
    })

    const alarmRef = ref(db, 'alarm/ivc');
    set(alarmRef, true)
  }

  const handleRescuerDetails = (rescuerId: any) => {
    setRescuerDetailsVisible(true);
    console.log(rescuerId)
    const rescuerRef = ref(db, 'users/' + rescuerId);
    get(rescuerRef).then((snapshot) => {
      if (snapshot.exists()) {
        const name = snapshot.val().name;
        const imageUrl = snapshot.val().imageUrl;
        const mobile = snapshot.val().mobile;
        const email = snapshot.val().email;
        setRescuerDetails({
          name: name,
          imageUrl: imageUrl,
          mobile: mobile,
          email: email,
        });
      } else {
        setRescuerDetails({
          name: "",
          imageUrl: "imageUrl",
          mobile: "mobile",
          email: "email",
        });
      }
    }).catch((error) => {
      console.error(error);
    });

  };

  const handleCancelIncident = () => {
    const confirmCancel = () => {
      Alert.alert(
        'Confirm Cancel',
        'Are you sure you want to cancel this incident?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: deleteIncident,
          },
        ],
      );
    };

    const deleteIncident = () => {
      const incidentRef = ref(db, 'incidents/' + incidentId);
      remove(incidentRef)
        .then(() => {
          setRescuerLocations([]);
          setIncident('');
          setMessageVisible(false);
          setRescuerDetailsVisible(false);
          Alert.alert('Incident Cancelled', 'Incident has been cancelled successfully.');
        })
        .catch((error) => {
          console.error('Error deleting incident:', error);
        });
    };

    confirmCancel();
  };

  const handleToggleView = () => {
    setIsMinimized(!isMinimized);
  };

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
                ref={cameraRef}
                zoomLevel={16}
                centerCoordinate={cameraCoordinates}
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
            {rescuerLocations.map((rescueLocation: any, index) => (
              <Mapbox.MarkerView
                key={rescueLocation.id}
                allowOverlap={true}
                allowOverlapWithPuck={true}
                coordinate={[rescueLocation.location.longitude, rescueLocation.location.latitude]}
              >
                <TouchableOpacity onPress={() => handleRescuerDetails(rescueLocation.id)}>
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
          {messageVisible ? (
            <TouchableOpacity
              className="absolute top-14 right-2 bg-white p-2 rounded-full"
              onPress={handleCancelIncident}
            >
              <AntDesign name="exclamationcircle" size={24} color="red" />
            </TouchableOpacity>
          ) : null}

          {!incident ? (
            <View className={`absolute bottom-0 rounded-xl w-[97%] bg-white p-4 mb-2 mx-auto ${isMinimized ? 'h-30' : 'h-85'}`}>
              <TouchableOpacity onPress={handleToggleView} className="flex-row justify-between items-center">
                <Text className='text-sm text-gray-400'>{isMinimized ? 'Show Reports' : 'Report Incident:'}</Text>
                <Ionicons name={isMinimized ? "chevron-up" : "chevron-down"} size={24} color="gray" />
              </TouchableOpacity>

              {!isMinimized && (
                <>
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
                </>
              )}

            </View>
          ) : null}
          {rescuerDetailsVisible ? (
            <View className={`absolute bottom-0 rounded-xl w-[97%] bg-white p-4 mb-2 mx-auto h-85'}`}>
              <TouchableOpacity onPress={() => setRescuerDetailsVisible(false)} className="flex-row justify-between items-center">
                <Text className='text-sm text-gray-400'>Rescuer Details:</Text>
                <Ionicons name="chevron-down" size={24} color="gray" />
              </TouchableOpacity>
              <Text className='text-base font-semibold text-[#3685cd]'>{rescuerDetails.name}</Text>

              <View className='border-gray-200 border-b mx-2 my-2' />
              <View className='flex-col justify-between gap-1'>
                <View className='flex-row items-center space-x-2 rounded-full'>
                  <View className='p-2 bg-gray-100 rounded-full'>
                    <Entypo name="phone" size={18} color="black" />
                  </View>
                  <Text onPress={() => { Linking.openURL(`tel:${rescuerDetails.mobile}`); }} className='text-black'>{rescuerDetails.mobile}</Text>
                </View>
                <View className='flex-row items-center space-x-2 rounded-full'>
                  <View className='p-2 bg-gray-100 rounded-full'>
                    <Entypo name="user" size={18} color="black" />
                  </View>
                  <Text className='text-black'>{rescuerDetails.name}</Text>
                </View>
                <View className='flex-row items-center space-x-2 rounded-full'>
                  <View className='p-2 bg-gray-100 rounded-full'>
                    <Entypo name="mail" size={18} color="black" />
                  </View>
                  <Text onPress={() => { Linking.openURL(`mailto:${rescuerDetails.email}`); }} className='text-black'>{rescuerDetails.email}</Text>
                </View>
              </View>
              <View className='flex-1 flex-row justify-between space-x-1'>
                <TouchableOpacity className='bg-[#cce5ff] border border-[#339af0] rounded-lg mt-3 p-2 w-1/2 items-center justify-center'>
                  <Text className='text-[#339af0] font-semibold'>Resolved</Text>
                </TouchableOpacity>
                <TouchableOpacity className='bg-white border-[#3685cd] border rounded-lg mt-3 p-2 w-1/2 items-center justify-center'>
                  <Text className='text-[#3685cd] font-semibold'>Cancel</Text>
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