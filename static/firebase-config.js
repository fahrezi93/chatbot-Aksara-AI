const firebaseConfig = {
    apiKey: "AIzaSyCN8AIpL_S-P8UFLx3lxHibiNVdP5el_nY",
    authDomain: "chatbot-gemini-bccf8.firebaseapp.com",
    projectId: "chatbot-gemini-bccf8",
    storageBucket: "chatbot-gemini-bccf8.firebasestorage.app",
    messagingSenderId: "7609111858",
    appId: "1:7609111858:web:20971142e3ac924fb8732b",
    measurementId: "G-ELGM0XYPDF"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}