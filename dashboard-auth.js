import { supabase } from './supabase.js';

// Check whether someone is actually logged in
const {
    data: { session },
    error
} = await supabase.auth.getSession();

if (error) {
    console.error('Session check failed:', error);
}

// No session = kick them back to login
if (!session) {
    window.location.replace('/index.html');
} else {
    const user = session.user;

    console.log('✅ Detective authenticated:', user.email);

    // Name entered during signup
    const detectiveName =
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Detective';

    // Update dashboard name
    const detectiveNameElement =
        document.getElementById('detectiveName');

    if (detectiveNameElement) {
        detectiveNameElement.textContent = `Det. ${detectiveName}`;
    }

    // Update email if we decide to display it
    const detectiveEmailElement =
        document.getElementById('detectiveEmail');

    if (detectiveEmailElement) {
        detectiveEmailElement.textContent = user.email;
    }
}

// Logout function
window.logoutDetective = async function () {

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Logout failed:', error);
        alert('Unable to log out. Please try again.');
        return;
    }

    window.location.replace('/index.html');
};