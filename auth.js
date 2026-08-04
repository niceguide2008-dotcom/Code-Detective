import { supabase } from "./supabase.js";

// =========================
// DOM ELEMENTS
// =========================

const form = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const nameField = document.getElementById("nameField");
const displayName = document.getElementById("displayName");

const email = document.getElementById("email");
const password = document.getElementById("password");

const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");

let mode = "login";

// =========================
// UI
// =========================

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = type;
}

function clearMessage() {
    message.textContent = "";
    message.className = "";
}

function setLoading(state) {
    submitBtn.disabled = state;

    if (state) {
        submitBtn.textContent =
            mode === "login"
                ? "AUTHENTICATING..."
                : "CREATING ACCOUNT...";
    } else {
        submitBtn.textContent =
            mode === "login"
                ? "ENTER HEADQUARTERS"
                : "CREATE DETECTIVE ACCOUNT";
    }
}

function switchMode(newMode) {

    mode = newMode;

    clearMessage();

    if (mode === "login") {

        loginTab.classList.add("active");
        signupTab.classList.remove("active");

        nameField.style.display = "none";
        displayName.required = false;

        password.autocomplete = "current-password";

        submitBtn.textContent = "ENTER HEADQUARTERS";

    } else {

        signupTab.classList.add("active");
        loginTab.classList.remove("active");

        nameField.style.display = "block";
        displayName.required = true;

        password.autocomplete = "new-password";

        submitBtn.textContent = "CREATE DETECTIVE ACCOUNT";
    }

}

// =========================
// REDIRECT
// =========================

function goHome() {
    window.location.replace("home.html");
}

// =========================
// SESSION CHECK
// =========================

async function checkSession() {

    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error(error);
        return;
    }

    if (session) {
        goHome();
    }

}
// =========================
// CREATE PROFILE
// =========================

async function createProfile(user, detectiveName) {

    if (!user) return;

    try {

        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                username: detectiveName,
                email: user.email
            });

        if (error) {
            console.error("[PROFILE]", error);
        }

    } catch (err) {
        console.error("[PROFILE]", err);
    }

}

// =========================
// SIGN UP
// =========================

async function signUpUser() {

    const detectiveName = displayName.value.trim();

    if (!detectiveName) {
        showMessage("Please enter your detective name.", "error");
        return;
    }

    const emailValue = email.value.trim();
    const passwordValue = password.value;

    const { data, error } = await supabase.auth.signUp({

        email: emailValue,

        password: passwordValue,

        options: {
            data: {
                display_name: detectiveName
            }
        }

    });

    if (error) {
        throw error;
    }

    const user = data.user ?? data.session?.user;

    if (!user) {

        showMessage(
            "Account created successfully. Please verify your email before logging in.",
            "success"
        );

        switchMode("login");
        return;
    }

    await createProfile(user, detectiveName);

    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (session) {
        goHome();
        return;
    }

    showMessage(
        "Account created successfully. Please log in.",
        "success"
    );

    switchMode("login");

}
// =========================
// LOGIN
// =========================

async function loginUser() {

    const emailValue = email.value.trim();
    const passwordValue = password.value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue
    });

    if (error) {
        throw error;
    }

    if (!data.session) {
        throw new Error("Unable to create login session.");
    }

    goHome();

}

// =========================
// FORM SUBMIT
// =========================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessage();

    const emailValue = email.value.trim();
    const passwordValue = password.value;

    if (!emailValue || !passwordValue) {

        showMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    setLoading(true);

    try {

        if (mode === "signup") {

            await signUpUser();

        } else {

            await loginUser();

        }

    } catch (error) {

        console.error("[AUTH]", error);

        showMessage(
            error.message || "Authentication failed.",
            "error"
        );

    } finally {

        setLoading(false);

    }

});
// =========================
// TAB SWITCHING
// =========================

loginTab.addEventListener("click", () => {
    switchMode("login");
});

signupTab.addEventListener("click", () => {
    switchMode("signup");
});

// =========================
// AUTH STATE LISTENER
// =========================

supabase.auth.onAuthStateChange((event, session) => {

    console.log("[AUTH EVENT]", event);

    if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session
    ) {
        goHome();
    }

});

// =========================
// AUTO SESSION CHECK
// =========================

window.addEventListener("load", async () => {

    await checkSession();

});
// =========================
// INITIALIZE
// =========================

switchMode("login");

// =========================
// GLOBAL ERROR HANDLING
// =========================

window.addEventListener("unhandledrejection", (event) => {

    console.error("[Unhandled Promise]", event.reason);

});

window.addEventListener("error", (event) => {

    console.error("[JavaScript Error]", event.error);

});

// =========================
// READY
// =========================

console.log("%cCode Detective Authentication Ready",
    "color:#00e5ff;font-size:14px;font-weight:bold;"
);