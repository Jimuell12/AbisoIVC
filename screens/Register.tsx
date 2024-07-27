    import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Button, Alert, Modal } from 'react-native'
    import React, { useRef, useState } from 'react'
    import { SafeAreaView } from 'react-native-safe-area-context'
    import { StatusBar } from 'expo-status-bar'
    import { AntDesign } from '@expo/vector-icons';
    import { CommonActions, Link, useNavigation } from '@react-navigation/native';
    import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';
    import { sendOTP } from '../utils/api';
    import { auth, db } from '../utils/firebaseConfig';
    import { createUserWithEmailAndPassword } from 'firebase/auth';
    import { ref, set } from 'firebase/database';


    export default function Register() {
        const navigation = useNavigation();
        const passwordInputRef = useRef<any>(null);
        const repeatPasswordInputRef = useRef<any>(null);
        const nameInputRef = useRef<any>(null);
        const mobileInputRef = useRef<any>(null);
        const addressInputRef = useRef<any>(null);
        
        const recaptcha = useRef<RecaptchaRef | null>(null);
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [name, setName] = useState('');
        const [mobile, setMobile] = useState('');
        const [address, setAddress] = useState('');
        const [repeatPassword, setRepeatPassword] = useState('');
        const [otp, setOtp] = useState('');
        const [enteredOtp, setEnteredOtp] = useState('');
        const [modalVisible, setModalVisible] = useState(false);

        const generateOtp = () => {
            return Math.floor(100000 + Math.random() * 900000).toString();
        };

        const send = () => {
            if(!email || !password || !name || !mobile || !address || !repeatPassword) {
                Alert.alert('Error', 'Please fill all fields');
                return;
            }else if(password !== repeatPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return
            }else if(password.length < 6) {
                Alert.alert('Error', 'Password must be at least 6 characters long');
                return
            }else if(mobile.length !== 11 && !mobile.startsWith('09')) {
                Alert.alert('Error', 'Mobile number must be 11 digits long and start with 09');
                return
            }else if(!email.includes('@') || !email.includes('.')) {
                Alert.alert('Error', 'Invalid email address');
                return
            }else{
                recaptcha.current?.open();
            }
        };

        const onVerify = (token: string) => {
            let newOtp = generateOtp();
            setOtp(newOtp);
            console.log(newOtp)
            sendOTP(email, newOtp);
            setModalVisible(true);
        };

        const onExpire = () => {
            console.warn('expired!');
        }

        const verifyOtp = async () => {
            if (enteredOtp === otp) {
                Alert.alert('Success', 'OTP verified successfully!');
                setModalVisible(false);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                const user = userCredential.user;
                handledatabase(user.uid);
                navigation.dispatch(
                    CommonActions.reset({
                    index: 0, // The index of the active route
                    routes: [{ name: 'Dashboard' }], // The name of the screen you want to navigate to
                    })
                );
            } else {
                Alert.alert('Error', 'Invalid OTP. Please try again.');
            }
        };

        const handledatabase = (uid: string) => {
            set(ref(db, 'users/' + uid), {
                email: email,
                name: name,
                mobile: mobile,
                address: address
            });
        };

        return (
            <SafeAreaView className='flex-1'>
                <StatusBar style='auto' />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className='flex-1'
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <View className='px-3 py-5 absolute items-center'>
                            <Link to="/Login"><AntDesign name="arrowleft" size={24} color="black" /></Link>
                        </View>
                        <View className='items-center p-3 mt-10'>
                            <Text className='text-6xl text-center font-bold text-[#3685cd]'>Create your account</Text>
                        </View>
                        <View className='px-8 mt-5'>
                            <TextInput
                                className='h-14 border border-gray-300 border-width-1 rounded-xl px-5'
                                placeholder='Email'
                                onChangeText={setEmail}
                                onSubmitEditing={() => nameInputRef.current?.focus()}
                            />
                            <TextInput
                                className='h-14 border border-gray-300 border-width-1 rounded-xl px-5 mt-3'
                                placeholder='Full name'
                                onChangeText={setName}
                                onSubmitEditing={() => mobileInputRef.current?.focus()}
                                ref={nameInputRef}
                            />
                            <TextInput
                                className='h-14 border border-gray-300 border-width-1 rounded-xl px-5 mt-3'
                                placeholder='Mobile number'
                                onChangeText={setMobile}
                                onSubmitEditing={() => addressInputRef.current?.focus()}
                                keyboardType='number-pad'
                                maxLength={11}
                                ref={mobileInputRef}
                            />
                            <TextInput
                                className='h-14 border border-gray-300 border-width-1 rounded-xl px-5 mt-3'
                                placeholder='Address'
                                onChangeText={setAddress}
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                                ref={addressInputRef}
                            />
                            <TextInput
                                className='h-14 border border-gray-300 border-width-1 rounded-xl px-5 mt-3'
                                secureTextEntry={true}
                                placeholder='Password'
                                onChangeText={setPassword}
                                onSubmitEditing={() => repeatPasswordInputRef.current?.focus()}
                                ref={passwordInputRef}
                            />
                            <TextInput
                                className='h-14 border border-gray-300 border-width-1 rounded-xl px-5 mt-3'
                                placeholder='Repeat Password'
                                onChangeText={setRepeatPassword}
                                onSubmitEditing={send}
                                ref={repeatPasswordInputRef}
                            />
                            <View>
                                <Recaptcha
                                    ref={recaptcha}
                                    siteKey="6LeZ6xUqAAAAAAhJvZzEpukyehV-myJxecXSL-fa"
                                    baseUrl="http://127.0.0.1"
                                    onVerify={onVerify}
                                    onExpire={onExpire}
                                    size="normal"
                                    enterprise={false}
                                    hideBadge={false}
                                />
                                <TouchableOpacity onPress={send} className='bg-[#3685cd] h-14 rounded-xl mt-3 items-center justify-center'>
                                    <Text className='text-white'>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                            <Text className='text-center mt-3'>Already have an account? <Link to='/Login'><Text className='text-[#3685cd]'>Login</Text></Link></Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <View style={{ width: 300, backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, marginBottom: 20 }}>OTP sent to your email</Text>
                            <TextInput
                                style={{ height: 40, borderColor: 'gray', borderWidth: 1, width: '100%', paddingHorizontal: 10, marginBottom: 20 }}
                                placeholder="Enter OTP"
                                value={enteredOtp}
                                onChangeText={setEnteredOtp}
                                keyboardType="numeric"
                                maxLength={6}
                            />
                            <TouchableOpacity onPress={verifyOtp} style={{ backgroundColor: '#3685cd', padding: 10, borderRadius: 5 }}>
                                <Text style={{ color: 'white' }}>Verify OTP</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        )
    }