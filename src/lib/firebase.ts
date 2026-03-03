import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    projectId: "habitrat-951a5",
    appId: "1:711923087175:web:b36260303ab079c1a07e62",
    storageBucket: "habitrat-951a5.firebasestorage.app",
    apiKey: "AIzaSyCySi2P801gjEElNcLr4H7xuMU9Jc0rL3g",
    authDomain: "habitrat-951a5.firebaseapp.com",
    messagingSenderId: "711923087175",
    measurementId: "G-4750FDPJ09"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
