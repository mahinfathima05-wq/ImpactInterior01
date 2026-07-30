// Replace these values with your Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyDpcPlLi6eElHGsaWxl3w3dTFOfE7Gh1do",
  authDomain: "impact-interior.firebaseapp.com",
  projectId: "impact-interior",
  storageBucket: "impact-interior.firebasestorage.app",
  messagingSenderId: "1068628128127",
  appId: "1:1068628128127:web:6a15763c1e1e5bbaf76a4a",
  measurementId: "G-64P183P98K"
}
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

window.auth = auth;
window.db = db;
window.storage = storage;

window.firebaseAuthReady = auth.signInAnonymously()
    .then((credential) => {
        console.log('Firebase anonymous auth signed in:', credential.user.uid);
        return credential.user;
    })
    .catch((error) => {
        console.error('Firebase auth failed:', error);
        alert('Firebase authentication failed. Check your console and Firebase rules.');
        return null;
    });
