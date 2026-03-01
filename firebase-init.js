// firebase-init.js
// Initializes Firebase and exposes all services on window.
// Imported as a module by every page via <script type="module" src="firebase-init.js">.
// Relies on the importmap defined inline in each HTML file for module resolution + SRI.

import { initializeApp }                                    from 'firebase-app';
import { getDatabase, ref, set, get, onValue }              from 'firebase-database';
import { getAuth, onAuthStateChanged, signOut,
         signInWithEmailAndPassword, updatePassword,
         EmailAuthProvider, reauthenticateWithCredential }  from 'firebase-auth';

const firebaseConfig = {
    apiKey:            "AIzaSyBpsal5vJ1b4nEjAfyQH1baKFRcuPV4QxI",
    authDomain:        "buster-league-draft.firebaseapp.com",
    databaseURL:       "https://buster-league-draft-default-rtdb.firebaseio.com",
    projectId:         "buster-league-draft",
    storageBucket:     "buster-league-draft.firebasestorage.app",
    messagingSenderId: "410413976342",
    appId:             "1:410413976342:web:2ed683daa1c808a2aa9e37",
    measurementId:     "G-DNJ7MC9VLW"
};

const app  = initializeApp(firebaseConfig);
const db   = getDatabase(app);
const auth = getAuth(app);

window.firebaseApp                = app;
window.firebaseDB                 = db;
window.firebaseRef                = ref;
window.firebaseSet                = set;
window.firebaseGet                = get;
window.firebaseOnValue            = onValue;
window.firebaseAuth               = auth;
window.firebaseSignOut            = signOut;
window.firebaseOnAuthStateChanged = onAuthStateChanged;
window.firebaseSignInWithEmail        = signInWithEmailAndPassword;
window.firebaseUpdatePassword         = updatePassword;
window.firebaseEmailAuthProvider      = EmailAuthProvider;
window.firebaseReauthenticate         = reauthenticateWithCredential;
window.firebaseInitialized            = true;
