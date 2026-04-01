document.addEventListener('DOMContentLoaded', function() {

// ============================================================
// FIREBASE CONFIG (UNCHANGED)
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyD5a5n1j8aKxTHRfAfOOAdnXdSn8mkpGe8",
  authDomain: "smart-factory-iot-dashboard.firebaseapp.com",
  databaseURL: "https://smart-factory-iot-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-factory-iot-dashboard",
  storageBucket: "smart-factory-iot-dashboard.firebasestorage.app",
  messagingSenderId: "307396796776",
  appId: "1:307396796776:web:51d0bde6fc9c864187f6dd"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.database();
const auth = firebase.auth();

auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// ============================================================
// LOGIN ELEMENTS
// ============================================================
const loginOverlay  = document.getElementById("loginOverlay");
const mainContent   = document.getElementById("mainContent");
const loginBtn      = document.getElementById("loginBtn");
const loginBtnText  = document.getElementById("loginBtnText");
const loginSpinner  = document.getElementById("loginSpinner");
const loginEmail    = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError    = document.getElementById("loginError");
const logoutBtn     = document.getElementById("logoutBtn");

// Prevent multiple init calls
let dashboardInitialized = false;

// ============================================================
// AUTH STATE
// ============================================================
auth.onAuthStateChanged(function(user) {

    if (user) {
        loginOverlay.style.display = "none";
        mainContent.style.display  = "block";

        if (!dashboardInitialized) {
            initDashboard();
            dashboardInitialized = true;
        }

    } else {
        loginOverlay.style.display = "flex";
        mainContent.style.display  = "none";
        dashboardInitialized = false;
    }
});

// ============================================================
// LOGIN
// ============================================================
loginBtn.addEventListener("click", function() {
    const email    = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    loginError.textContent = "";

    if (!email || !password) {
        loginError.textContent = "Please enter both email and password.";
        return;
    }

    loginBtnText.textContent   = "Signing in...";
    loginSpinner.style.display = "inline-block";
    loginBtn.disabled          = true;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginBtnText.textContent   = "Login";
            loginSpinner.style.display = "none";
            loginBtn.disabled          = false;
        })
        .catch(function(err) {
            loginError.textContent     = getFriendlyError(err.code);
            loginBtnText.textContent   = "Login";
            loginSpinner.style.display = "none";
            loginBtn.disabled          = false;
        });
});

// Enter key login
loginPassword.addEventListener("keydown", function(e) {
    if (e.key === "Enter") loginBtn.click();
});

// Logout
logoutBtn.addEventListener("click", function(e) {
    e.preventDefault();
    auth.signOut();
});

// ============================================================
// ERROR HANDLER
// ============================================================
function getFriendlyError(code) {
    switch (code) {
        case "auth/invalid-email":          return "Invalid email address.";
        case "auth/user-not-found":         return "No account found with this email.";
        case "auth/wrong-password":         return "Incorrect password.";
        case "auth/invalid-credential":     return "Incorrect email or password.";
        case "auth/too-many-requests":      return "Too many attempts. Please try again later.";
        case "auth/network-request-failed": return "Network error. Check your connection.";
        default:                            return "Login failed. Please try again.";
    }
}

// ============================================================
// DASHBOARD
// ============================================================
function initDashboard() {

    const toggleInputs = document.querySelectorAll('.toggle-input');
    const controlCards = document.querySelectorAll('.control-card');
    const toastContainer = document.getElementById('toastContainer');
    const powerOffBtn = document.getElementById('powerOffBtn');

    const devices = ["fan", "light", "conveyor", "buzzer"]; // ✅ FIXED

    // CONTROL → FIREBASE
    toggleInputs.forEach((input, index) => {
        input.addEventListener('change', function() {
            const card   = controlCards[index];
            const device = card.dataset.equipment;
            const isOn   = this.checked ? 1 : 0;

            db.ref("/" + device).set(isOn);

            if (isOn) {
                card.classList.add('on');
                showToast(device + " turned ON", "success");
            } else {
                card.classList.remove('on');
                showToast(device + " turned OFF", "info");
            }
        });
    });

    // FIREBASE → UI
    devices.forEach(device => {
        db.ref("/" + device).on("value", snapshot => {
            const value = snapshot.val();
            const card  = document.querySelector(`[data-equipment="${device}"]`);
            if (!card) return;

            const toggle = card.querySelector('.toggle-input');
            toggle.checked = value === 1;

            card.classList.toggle('on', value === 1);
        });
    });

    // SENSOR DATA
    db.ref("/sensor").on("value", snapshot => {
        const data = snapshot.val();
        if (!data) return;

        document.getElementById("temp").textContent     = data.temperature + "°C";
        document.getElementById("humidity").textContent = data.humidity + "%";
    });

    // POWER OFF ALL (✅ FIXED BUZZER ISSUE)
    powerOffBtn.addEventListener('click', function() {
        const updates = {
            "/fan": 0,
            "/light": 0,
            "/conveyor": 0,
            "/buzzer": 0   // ✅ FIXED
        };

        db.ref().update(updates);

        showToast("All equipment powered OFF", "warning");
    });

    // CONTACT FORM
    const contactForm = document.querySelector('.contact-form');
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name    = this.querySelector('input').value;
        const message = this.querySelector('textarea').value;

        if (name && message) {
            alert("Thank you " + name + "! Message sent.");
            this.reset();
            showToast("Message sent successfully", "success");
        }
    });

    // SHOW SECTIONS
    document.querySelectorAll("section").forEach(sec => {
        sec.classList.add("visible");
    });

    function showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = "toast " + type;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

});
