// Your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toggleText = document.getElementById('toggle-text');
const toggleLink = document.getElementById('toggle-link');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');
const adminPanel = document.getElementById('admin-panel');
const messagesDiv = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const deleteAllMessagesBtn = document.getElementById('delete-all-messages');

// Toggle between login and signup
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (signupForm.style.display === 'none') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign In';
    } else {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
    }
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(error.message);
        });
});

// Signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(error.message);
        });
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Send message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (message.trim() !== '') {
        db.collection('messages').add({
            text: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            user: auth.currentUser.email,
            uid: auth.currentUser.uid
        });
        messageInput.value = '';
    }
});

// Load messages
function loadMessages() {
    db.collection('messages')
        .orderBy('timestamp')
        .onSnapshot(snapshot => {
            messagesDiv.innerHTML = '';
            snapshot.forEach(doc => {
                const message = doc.data();
                const messageElement = document.createElement('div');
                messageElement.className = `message ${message.uid === auth.currentUser.uid ? 'message--sent' : 'message--received'}`;
                messageElement.innerHTML = `
                    <div class="message-info">${message.user}</div>
                    <div>${message.text}</div>
                `;
                messagesDiv.appendChild(messageElement);
            });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
}

// Check if user is admin
async function isAdmin(user) {
    await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult();
    return !!idTokenResult.claims?.admin;
}

// Admin: Delete all messages
deleteAllMessagesBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all messages?')) {
        db.collection('messages').get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
        });
    }
});

// Auth state listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        authContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        userEmailSpan.textContent = user.email;
        const admin = await isAdmin(user);
        adminPanel.style.display = admin ? 'block' : 'none';
        loadMessages();
    } else {
        authContainer.style.display = 'block';
        chatContainer.style.display = 'none';
        adminPanel.style.display = 'none';
    }
});
