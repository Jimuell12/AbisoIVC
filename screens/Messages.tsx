import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { get, ref, set, onValue, push } from 'firebase/database';
import { auth, db, storage } from '../utils/firebaseConfig';
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { imageToBlob } from '../utils/api';
import { getData, removeData, storeData } from '../utils/asyncStorage';
import { StatusBar } from 'expo-status-bar';

const faqs = [
  { question: 'How do I request help in an emergency?', answer: 'Click the appropriate button for fire, flood, earthquake, or manmade incidents. Your request will be sent in real-time to available rescuers.' },
  { question: 'How can I see the location of the rescuer?', answer: 'Once a rescuer accepts your request, you will be able to see their real-time location on the map.' },
  { question: 'How can rescuers see my location?', answer: 'When you request help, your location is shared with the rescuers who accept your request. They can track your real-time location on their map.' },
  { question: 'Can I cancel my rescue request?', answer: 'Yes, you can cancel your request at any time if you no longer need assistance. The request will be removed from the rescuer’s view.' },
  { question: 'How do I get notifications for rescue requests?', answer: 'You will receive notifications when a rescuer accepts your request or when there are updates regarding your request.' },
];


export default function Messages({ route }: any) {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<{ type: string; text: string; userType: string; timestamp: any }[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollview = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const [userType, setUserType] = useState('user');
  const [reportedBy, setReportedBy] = useState('');
  const [reportByRole, setReportByRole] = useState('');
  const [image, setImage] = useState(require('../assets/images/abiso_logo.png'));

  useEffect(() => {
    const incidentId = route.params.incidentId;
    const incidentMessageRef = ref(db, `incidents/${incidentId}/messages`);

    // Real-time listener for new messages
    const unsubscribe = onValue(incidentMessageRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const fetchedMessages = Object.keys(data).map(key => data[key]);

        setMessages(fetchedMessages);
        scrollview.current.scrollToEnd({ animated: true });
      }
    }, {
      onlyOnce: false
    });

    // Clean up listener on component unmount
    return () => unsubscribe();
  }, [route.params.incidentId]);

  useEffect(() => {
    getData("draft").then(draftMessage => setInputText(draftMessage || ''))
    const userRef = ref(db, `users/${auth.currentUser?.uid}`);
    get(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const role = data.role;
        setUserType(role);

        const requestorRef = ref(db, `incidents/${route.params.incidentId}`);
        get(requestorRef).then(snapshot => {
          const data = snapshot.val();
          setReportedBy(data.reportedBy);

          if (data.reportedBy && role === "rescuer") {
            const userRef = ref(db, `users/${data.reportedBy}`);
            get(userRef).then(snapshot => {
              if (snapshot.exists()) {
                const data = snapshot.val();
                setReportByRole(data.role);
                setImage(data.imageUrl ? { uri: data.imageUrl } : require('../assets/images/abiso_logo.png'));
              }
            });
          }
        });
      }
    });
  }, []);

  const handleImagePicker = () => {
    const handlePicker = async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (pickerResult.canceled === true) {
        return;
      }

      const imageFileName = `${Date.now()}.jpg`;
      const messageImagesRef = storageRef(storage, 'images/' + imageFileName);
      const blob = await imageToBlob(pickerResult.assets[0].uri);
      console.log(blob)
      uploadBytes(messageImagesRef, blob).then(async snapshot => {
        const downloadURL = await getDownloadURL(snapshot.ref);
        const incidentId = route.params.incidentId;
        const incidentMessageRef = ref(db, `incidents/${incidentId}/messages`);

        const newMessage = {
          type: 'image',
          text: downloadURL,
          userType: userType,
          timestamp: Date.now(),
        };

        push(incidentMessageRef, newMessage);
      });


    };
    handlePicker();
  };

  const handleImageCapture = () => {
    const handleCapture = async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (pickerResult.canceled === true) {
        return;
      }

      const imageFileName = `${Date.now()}.jpg`;
      const messageImagesRef = storageRef(storage, 'images/' + imageFileName);
      const blob = await imageToBlob(pickerResult.assets[0].uri);
      console.log(blob)
      uploadBytes(messageImagesRef, blob).then(async snapshot => {
        const downloadURL = await getDownloadURL(snapshot.ref);
        const incidentId = route.params.incidentId;
        const incidentMessageRef = ref(db, `incidents/${incidentId}/messages`);

        const newMessage = {
          type: 'image',
          text: downloadURL,
          userType: userType,
          timestamp: Date.now(),
        };

        push(incidentMessageRef, newMessage);
      });


    };
    handleCapture();
  };

  const handleFaqPress = (faq: any) => {
    const incidentId = route.params.incidentId;
    const incidentMessageRef = ref(db, `incidents/${incidentId}/messages`);

    const newFaqMessage = {
      type: 'text',
      text: faq.answer,
      userType: 'rescuer',
      timestamp: Date.now(),
    };
    const newFaqQuestion = {
      type: 'text',
      text: faq.question,
      userType: 'user',
      timestamp: Date.now(),
    };
    push(incidentMessageRef, newFaqQuestion);
    push(incidentMessageRef, newFaqMessage);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      inputRef.current.blur();
      const incidentId = route.params.incidentId;
      const incidentMessageRef = ref(db, `incidents/${incidentId}/messages`);

      const newMessage = {
        type: 'text',
        text: inputText,
        userType: userType,
        timestamp: Date.now(),
      };

      push(incidentMessageRef, newMessage);

      removeData("draft");
      setInputText('');
    }
  };

  const handleTextChange = (text: any) => {
    setInputText(text);
    storeData("draft", text);
  };


  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar translucent backgroundColor='transparent' />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'>
        <View className='flex-1'>
          <View className='px-3 py-3 items-center flex-row justify-between'>
            <AntDesign name="arrowleft" size={20} color="gray" onPress={() => navigation.goBack()} />
            <Text className='text-lg text-center font-bold text-[#3685cd]'>Messages</Text>
            <AntDesign name="exclamationcircleo" size={20} color="gray" />
          </View>

          <ScrollView ref={scrollview} className='flex-1 px-3' contentContainerStyle={{ flexGrow: 1, paddingVertical: 3 }}>
            <View className='w-72 h-72 self-center'>
              <Image source={require('../assets/images/abiso_logo.png')} className='self-center h-full w-full p-4' />

            </View>
            {userType === 'user' ? (
              <View>
                {faqs.map((faq, index) => (
                  <TouchableOpacity key={index} onPress={() => handleFaqPress(faq)} className='mb-4 border-[#3685cd] border px-3 py-1 rounded-3xl self-center'>
                    <Text className='text-base font-semibold text-right text-[#3685cd]'>{faq.question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <View>
              {messages.map((message, index) => (
                <View
                  key={index}
                  className={`mb-2 p-3 rounded-lg ${message.userType === userType ? 'bg-[#c3d9ec] self-end' : 'bg-[#f0f0f0] self-start'}`}
                  style={{ maxWidth: 320, flexDirection: message.userType === userType ? 'row-reverse' : 'row', alignItems: 'center' }}
                >
                  {message.userType !== userType ? (
                    <Image source={image} style={{ width: 30, height: 30, borderRadius: 20, marginRight: 5, alignSelf: 'flex-start' }} />
                  ) : null}
                  {message.type === 'image' ? (
                    <Image source={{ uri: message.text }} style={{ width: 250, height: 350, resizeMode: 'contain', marginRight: 5, alignSelf: 'center' }} />
                  ) : null}
                  {message.type === 'text' ? (
                    <View className='flex-shrink'>
                      <Text className='text-base' selectable>{message.text}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </ScrollView>

          <View className='flex-row items-center justify-evenly px-2 py-3 bg-[#c3d9ec]'>

            <TouchableOpacity onPress={handleImagePicker} className='p-2'>
              <AntDesign name="pluscircleo" size={22} color="#3685cd" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleImageCapture} className='p-2'>
              <FontAwesome5 name="camera" size={22} color="#3685cd" />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              className='flex-1 h-10 bg-white rounded-full px-3'
              multiline
              placeholder='Type a message'
              value={inputText}
              onChangeText={handleTextChange}
            />
            <TouchableOpacity onPress={handleSend} className='p-2'>
              <FontAwesome5 name="paper-plane" size={22} color="#3685cd" />
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
