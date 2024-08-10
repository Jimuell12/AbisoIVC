import { initializeApp } from "firebase/app";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDs50GubyvwSPc62SBw2S-cV7D-SF7wqzo",
  authDomain: "abiso-ivc.firebaseapp.com",
  databaseURL: "https://abiso-ivc-default-rtdb.firebaseio.com",
  projectId: "abiso-ivc",
  storageBucket: "abiso-ivc.appspot.com",
  messagingSenderId: "517759657382",
  appId: "1:517759657382:web:0bf1964c9a063fcbe05b67"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {persistence: getReactNativePersistence(AsyncStorage),});
const db = getDatabase(app);
const storage = getStorage(app);
const user = auth.currentUser;

export { user, auth, db, storage };