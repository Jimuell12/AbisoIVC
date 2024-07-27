import { Text, View, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useNavigation, CommonActions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar'
import React, { useRef, useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../utils/firebaseConfig';

export default function Login() {
    const navigation = useNavigation();
    const passwordInputRef = useRef<any>(null);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Signed in
            const user = userCredential.user;
            navigation.dispatch(
                CommonActions.reset({
                  index: 0, // The index of the active route
                  routes: [{ name: 'Dashboard' }], // The name of the screen you want to navigate to
                })
              );
        } catch (error:any) {
            Alert.alert('Login Error', 'Invalid email or password');
            // Handle login error (e.g., show an alert)
        }
    };

    return (
        <SafeAreaView className='flex-1'>
            <StatusBar style='auto'/>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View className='items-center p-3'>
                        <Text className='text-2xl font-bold text-[#3685cd]'>Login</Text>
                    </View>
                    <View className='p-5 w-full'>
                        <Image source={require('../assets/images/abiso_logo.png')} className='w-full'/>
                    </View>
                    <View className='px-8'>
                        <TextInput
                            className='h-14 border border-gray-300 border-width-1 rounded-xl px-5'
                            placeholder='Email'
                            onChangeText={setEmail}
                            onBlur={() => passwordInputRef.current?.focus()}
                        />
                        <TextInput
                            ref={passwordInputRef}
                            className='h-14 border border-gray-300 border-width-1 rounded-xl px-5 mt-3'
                            secureTextEntry={true}
                            placeholder='Password'
                            onChangeText={setPassword}
                            onSubmitEditing={handleLogin}
                        />
                        <Text className='text-[#3685cd] text-right mt-3'>Forgot password?</Text>
                        <TouchableOpacity onPress={handleLogin} className='bg-[#3685cd] h-14 rounded-xl mt-3 items-center justify-center'>
                            <Text className='text-white'>Login</Text>
                        </TouchableOpacity>
                        <Text className='text-center mt-3'>Don't have an account? <Link to="/Register"><Text className='text-[#3685cd]'>Sign Up</Text></Link></Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
