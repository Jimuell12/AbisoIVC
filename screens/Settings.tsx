import { View, Text, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { AntDesign, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../utils/firebaseConfig';
import { get, ref, set } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';

export default function Settings() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [imageUrl, setImageUrl] = useState(require('../assets/images/profile2.jpg'));

    useEffect(() => {
        const updateUserDetails = async () => {
            if (auth.currentUser) {
              const userRef = ref(db, 'users/' + auth.currentUser.uid);
              get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                  const name = snapshot.val().name;
                  const imageUrl = snapshot.val().imageUrl;
                  const email = snapshot.val().email;
                  const mobile = snapshot.val().mobile;
                  const address = snapshot.val().address;
                
                  setEmail(email);
                  setName(name);
                  setMobile(mobile);
                  setAddress(address)
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
        
          updateUserDetails();
    }, []);

    const handleChangeimageUrl = () => {
        // Add image picker here
        const handleChangeimageUrl = async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                alert('Permission to access camera roll is required!');
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync();
            if (pickerResult.canceled === true) {
                return;
            }

            setImageUrl({ uri: pickerResult.assets[0].uri });
        };
        handleChangeimageUrl();
    };

    return (
        <SafeAreaView className='flex-1 bg-white'>
            <StatusBar style='auto' />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className='flex-1'
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View className='px-3 py-5 absolute items-center'>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <AntDesign name="arrowleft" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View className='items-center p-3 mt-5'>
                        <Text className='text-xl text-center font-bold text-black'>Settings</Text>
                    </View>
                    <View className='flex-col w-full items-center'>
                        <View className='relative'>
                            <Image className='items-center h-52 w-52 p-0 rounded-full justify-center' source={imageUrl}>
                            </Image>
                            <TouchableOpacity className='absolute bottom-3 right-3 p-2 bg-blue-100 rounded-full border-2 border-white' onPress={handleChangeimageUrl}>
                                <Entypo name="edit" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <Text className='text-base text-black font-bold mt-2'>@jimflojera</Text>
                    </View>
                    <View className='p-2'>
                        <Text className='text-lg text-black font-bold px-3'>Account</Text>
                        <Text className='text-sm text-gray-500 px-3 pb-2'>Personal Information</Text>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="user" size={26} color="black" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-gray-500'>Name</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={name} onChangeText={(input)=>{setName(input)}} />
                            </View>
                        </View>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="mail" size={26} color="black" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-gray-500'>Email</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={email} onChangeText={(input)=>{setEmail(input)}} />
                            </View>
                        </View>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="phone" size={26} color="black" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-gray-500'>Mobile No.</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={mobile} onChangeText={(input)=>{setMobile(input)}} />
                            </View>
                        </View>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="home" size={26} color="black" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-gray-500'>Address</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={address} onChangeText={(input)=>{setAddress(input)}} />
                            </View>
                        </View>
                        <Text className='px-3 text-red-400'>Error here</Text>
                        <TouchableOpacity className='bg-gray-800 p-3 rounded-lg m-3'>
                            <Text className='text-white text-center'>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

        </SafeAreaView>
    )
}