import { supabase } from './supabase.js';

const $ = (id) => document.getElementById(id);

const form = $('authForm');
const loginTab = $('loginTab');
const signupTab = $('signupTab');
const nameField = $('nameField');
const displayName = $('displayName');
const email = $('email');
const password = $('password');
const submitBtn = $('submitBtn');
const message = $('message');

if (!form) {
    console.error('[Auth] authForm not found.');
}

let mode = 'login';

function showMessage(text, type = '') {
    message.textContent = text;
    message.className = type;
}

function clearMessage() {
    showMessage('', '');
}

function setMode(newMode) {
    mode = newMode;
    clearMessage();

    const signup = mode === 'signup';

    loginTab.classList.toggle('active', !signup);
    signupTab.classList.toggle('active', signup);

    nameField.style.display = signup ? 'block' : 'none';
    displayName.required = signup;

    password.autocomplete = signup
        ? 'new-password'
        : 'current-password';

    submitBtn.textContent = signup
        ? 'CREATE DETECTIVE ACCOUNT'
        : 'ENTER HEADQUARTERS';
}

async function redirectHome() {
    window.location.replace(
        new URL('home.html', window.location.href).href
    );
}



loginTab?.addEventListener('click', () => setMode('login'));
signupTab?.addEventListener('click', () => setMode('signup'));

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearMessage();

    const mail = email.value.trim();
    const pass = password.value;

    if (!mail || !pass) {
        return showMessage(
            'Enter your email and password.',
            'error'
        );
    }

    submitBtn.disabled = true;

    try { 
        if (mode === 'signup') {

            const name = displayName.value.trim();

            if (!name) {
                throw new Error('Enter your detective name.');
            }

            const { data, error } = await supabase.auth.signUp({
                email: mail,
                password: pass,
                options: {
                    data: {
                        display_name: name
                    }
                }
            });

            if (error) {
                throw error;
            }

            const user = data.user ?? data.session?.user;

            if (user) {
                await createProfile(
                    user.id,
                    name,
                    mail
                );
            }

            if (data.session) {
                return redirectHome();
            }

            showMessage(
                'Account created. Verify your email, then sign in.',
                'success'
            );

            setMode('login');
            return;
        }

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: mail,
                password: pass
            });

        if (error) {
            throw error;
        }

        if (!data.session) {
            throw new Error(
                'Login succeeded but no session was created.'
            );
        }

        redirectHome();
            } catch (err) {

        console.error(err);

        showMessage(
            err.message || 'Authentication failed.',
            'error'
        );

    } finally {

        submitBtn.disabled = false;

        submitBtn.textContent =
            mode === 'signup'
                ? 'CREATE DETECTIVE ACCOUNT'
                : 'ENTER HEADQUARTERS';
    }

});
checkSession();
setMode('login');