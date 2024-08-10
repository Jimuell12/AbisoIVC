import { View, Text, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { AntDesign, Entypo } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../utils/firebaseConfig';
import { get, ref, set, update } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { imageToBlob } from '../utils/api';

export default function Settings() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [imageUrl, setImageUrl] = useState(require('../assets/images/profile2.jpg'));
    const [message, setMessage] = useState({ message: '', type: '' });

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
            uploadBytes(messageImagesRef, blob).then(async snapshot => {
                const downloadURL = await getDownloadURL(snapshot.ref);
                const incidentMessageRef = ref(db, `users/`+auth.currentUser?.uid+`/imageUrl`);
        
                set(incidentMessageRef, downloadURL);
              });

            setImageUrl({ uri: pickerResult.assets[0].uri });
        };
        handleChangeimageUrl();
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

    const handleSaveChanges = () => {
        const userRef = ref(db, 'users/' + auth.currentUser?.uid);
        if(!name || !email || !mobile || !address){
            setMessage({message: "Please fill up all fields", type: "error"});
            return
        }
        else if(!email.includes('@') || !email.includes('.')){
            setMessage({message: 'Invalid email address', type: 'error'});
            return
        }else if(mobile.length != 11){
            setMessage({message:'Invalid mobile number', type: 'error'});
            return
        }
        update(userRef, {
            name: name,
            email: email,
            mobile: mobile,
            address: address,
        }).then(() => {
            setMessage({message:'Changes saved successfully', type: 'success'});
        }).catch((error) => {
            setMessage({message:'Error saving changes', type: 'error'});
        });
    };

    return (
        <SafeAreaView className='flex-1 bg-white'>
            <StatusBar style='auto' />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className='flex-1'
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View className='px-3 py-5 absolute items-center flex-row justify-between w-full'>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <AntDesign name="arrowleft" size={24} color="#3685cd" />
                        </TouchableOpacity>
                        <Text className='text-xl text-center font-bold text-[#3685cd]'>Settings</Text>
                        <View className='w-6'></View>
                    </View>
                    <View className='flex-col w-full items-center mt-16'>
                        <View className='relative'>
                            <Image className='items-center h-52 w-52 p-0 rounded-full justify-center' source={imageUrl}>
                            </Image>
                            <TouchableOpacity className='absolute bottom-3 right-3 p-2 bg-blue-100 rounded-full border-2 border-white' onPress={handleChangeimageUrl}>
                                <Entypo name="edit" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <Text className='text-base text-[#3685cd] font-bold mt-2'>{name}</Text>
                    </View>
                    <View className='p-2 flex-1'>
                        <Text className='text-lg text-[#3685cd] font-bold px-3'>Account</Text>
                        <Text className='text-sm text-gray-500 px-3 pb-2'>Personal Information</Text>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="user" size={26} color="#3685cd" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-[#3685cd]'>Name</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={name} onChangeText={(input) => { setName(input) }} />
                            </View>
                        </View>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="mail" size={26} color="#3685cd" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-[#3685cd]'>Email</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={email} onChangeText={(input) => { setEmail(input) }} />
                            </View>
                        </View>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="phone" size={26} color="#3685cd" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-[#3685cd]'>Mobile No.</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={mobile} onChangeText={(input) => { setMobile(input) }} />
                            </View>
                        </View>
                        <View className='flex-row p-3 gap-2 items-end'>
                            <View className='bg-gray-100 p-2 rounded-lg'>
                                <AntDesign name="home" size={26} color="#3685cd" />
                            </View>
                            <View className='h-12 flex-1'>
                                <Text className='text-[#3685cd]'>Address</Text>
                                <TextInput className='border-b-2 border-gray-300 flex-1' value={address} onChangeText={(input) => { setAddress(input) }} />
                            </View>
                        </View>
                        <Text className={`text-sm ${message.type == 'error' ? 'text-red-500' : 'text-green-500'} text-center`}>{message.message}</Text>
                        <View className='flex-1 justify-end'>
                            <TouchableOpacity className='bg-[#3685cd] p-3 rounded-lg mx-3 mt-2' onPress={handleSaveChanges}>
                                <Text className='text-white text-center'>Save Changes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className='bg-red-500 p-3 rounded-lg mx-3 my-2' onPress={logout}>
                                <Text className='text-white text-center'>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

        </SafeAreaView>
    )
}