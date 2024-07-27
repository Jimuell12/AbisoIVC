import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Settings() {
    const navigation = useNavigation();


    return (
        <SafeAreaView className='flex-1'>
            <StatusBar />
            <View className='px-3 py-5 absolute items-center'>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AntDesign name="arrowleft" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <View className='items-center p-3 mt-5'>
                <Text className='text-xl text-center font-bold text-black'>Settings</Text>
            </View>
            <View className='flex-col w-full items-center'>
                <Image className='w-72 items-center h-80 p-0' source={require('../assets/images/abiso_logo.png')}>
                </Image>
                <Text className='text-2xl text-black font-bold'>Jimuel FLojera</Text>
                <Text className='text-sm text-black font-thin'>flojera.j.bscs@gmail.com</Text>
            </View>
        </SafeAreaView>
    )
}