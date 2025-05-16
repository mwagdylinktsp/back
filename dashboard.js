import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD1_MuUCT4U3YaI0-yRGaKO0sVnXFGfxCU",
  authDomain: "norween-invoices.firebaseapp.com",
  projectId: "norween-invoices",
  storageBucket: "norween-invoices.appspot.com",
  messagingSenderId: "1001073857267",
  appId: "1:1001073857267:web:a0d632f13f6316baac1d86"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Theme toggle
const toggle = document.getElementById("toggle");
const html = document.documentElement;

function applyTheme(theme) {
  if (theme === "dark") {
    html.classList.add("dark");
    toggle.checked = true;
  } else {
    html.classList.remove("dark");
    toggle.checked = false;
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("color-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));
}

toggle.addEventListener("change", function () {
  const theme = this.checked ? "dark" : "light";
  localStorage.setItem("color-theme", theme);
  applyTheme(theme);
});

initializeTheme();

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const qs = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
  const meSnap = qs.docs[0];
  const me = meSnap.data();
    const { role } = me;

  // Permissions: handled via data-permission attribute now
  const allCards = document.querySelectorAll(".dashboard-card");
allCards.forEach(card => {
  const allowedRoles = card.dataset.permission ? card.dataset.permission.split(",") : ["all"];

  if (allowedRoles.includes(role) || allowedRoles.includes("all") || role === "admin") {
    card.classList.remove("hidden");
  } else {
    card.classList.add("hidden");
  }
});

  // Hide sections with no visible cards
  document.querySelectorAll("section").forEach(section => {
    const visibleCards = section.querySelectorAll(".dashboard-card:not(.hidden)");
    if (visibleCards.length === 0) {
      section.classList.add("hidden");
    } else {
      section.classList.remove("hidden");
    }
  });

  // Set user name
  const name = document.getElementById("name");
  if (meSnap?.name && name) {
    name.textContent = meSnap.name;
  }

  // Counters
  onSnapshot(collection(db, "customers"), (snapshot) => {
    document.getElementById("customerCount").textContent = snapshot.size;
  });

  onSnapshot(query(collection(db, "tickets"), where("status", "==", "new")), (snapshot) => {
    const count = snapshot.size;
    document.getElementById("newTicketsCount").textContent = count;
    const badge = document.getElementById("newTicketsCountBadge");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "block" : "none";
    }
  });

  onSnapshot(query(collection(db, "visits"), where("status", "==", "pending")), (snapshot) => {
    const count = snapshot.size;
    document.getElementById("newVisitsCount").textContent = count;
    const badge = document.getElementById("newVisitsCountBadge");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "block" : "none";
    }
  });

  // Show main content
  document.getElementById("loader").style.display = "none";
  document.getElementById("mainContent").classList.remove("hidden");
});

// Logout
window.logout = function () {
  localStorage.removeItem("idToken");
  localStorage.removeItem("color-theme");
  window.location.href = "login.html";
};
