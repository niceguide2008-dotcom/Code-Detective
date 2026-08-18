import { supabase } from './supabase.js';

console.log('[Auth] Auth module loaded');

const $ = (id) => document.getElementById(id);

const form = $('authForm');
const loginTab = $('loginTab');
const signupTab = $('signupTab');
const nameField = $('nameField');
const displayName = $('displayName');
const email = $('email');
const password = $('password');
const passwordToggle = $('passwordToggle');
const submitBtn = $('submitBtn');
const message = $('message');

const forgotPasswordBtn = $('forgotPasswordBtn');
const forgotPanel = $('forgotPanel');
const forgotForm = $('forgotForm');
const forgotEmail = $('forgotEmail');
const forgotSubmitBtn = $('forgotSubmitBtn');
const backToLoginBtn = $('backToLoginBtn');
const googleBtn = $('googleBtn');

let mode = 'login';

function showMessage(text, type = '') {
    if (!message) return;
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

    loginTab?.classList.toggle('active', !signup);
    signupTab?.classList.toggle('active', signup);

    if (nameField) {
        nameField.style.display = signup ? 'block' : 'none';
    }

    if (displayName) {
        displayName.required = signup;
    }

    if (password) {
        password.autocomplete =
            signup ? 'new-password' : 'current-password';
    }

    if (submitBtn) {
        submitBtn.textContent = signup
            ? 'CREATE DETECTIVE ACCOUNT'
            : 'ENTER HEADQUARTERS';
    }

    if (forgotPanel) {
        forgotPanel.classList.remove('active');
        forgotPanel.setAttribute('aria-hidden', 'true');
    }

    if (form) form.style.display = '';
    if (googleBtn) googleBtn.style.display = '';
}

function openForgotPanel() {
    clearMessage();

    if (form) {
        form.style.display = 'none';
    }

    if (googleBtn) {
        googleBtn.style.display = 'none';
    }

    if (forgotPanel) {
        forgotPanel.classList.add('active');
        forgotPanel.setAttribute('aria-hidden', 'false');
    }

    if (forgotEmail && email?.value.trim()) {
        forgotEmail.value = email.value.trim();
    }

    forgotEmail?.focus();
}

function closeForgotPanel() {
    clearMessage();

    if (forgotPanel) {
        forgotPanel.classList.remove('active');
        forgotPanel.setAttribute('aria-hidden', 'true');
    }

    if (form) {
        form.style.display = '';
    }

    if (googleBtn) {
        googleBtn.style.display = '';
    }
}

async function redirectHome() {
    window.location.replace(
        new URL('home.html', window.location.href).href
    );
}

/*
 * Supabase recovery links can occasionally arrive at the configured
 * Site URL instead of the requested redirect URL (for example when the
 * redirect URL is not present in the Supabase allow-list). If the
 * current URL contains recovery credentials, always hand the complete
 * URL to reset-password.html instead of allowing normal login routing
 * to send the user to home.html.
 */
function isPasswordRecoveryUrl() {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, '')
    );

    return (
        query.get('type') === 'recovery' ||
        hash.get('type') === 'recovery' ||
        Boolean(query.get('access_token')) ||
        Boolean(hash.get('access_token')) ||
        Boolean(query.get('code'))
    );
}

function redirectToPasswordResetIfNeeded() {
    if (!isPasswordRecoveryUrl()) return false;

    const resetUrl = new URL(
        'reset-password.html',
        window.location.href
    );

    // Preserve Supabase's recovery parameters exactly as received.
    resetUrl.search = window.location.search;
    resetUrl.hash = window.location.hash;

    console.info('[Auth] Password recovery detected; opening reset-password.html');
    window.location.replace(resetUrl.href);
    return true;
}

async function createProfile(userId, name, emailAddr) {
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                username: name,
                email: emailAddr
            });

        if (error) {
            console.error(
                '[Profile] Failed to create/update profile:',
                error
            );
        }
    } catch (error) {
        console.error(
            '[Profile] Unexpected error:',
            error
        );
    }
}

async function checkSession() {
    try {
        // Recovery routing must happen before the normal authenticated-user
        // redirect, otherwise index.html can send the user to home.html.
        if (redirectToPasswordResetIfNeeded()) {
            return;
        }

        const {
            data: { session },
            error
        } = await supabase.auth.getSession();

        if (error) {
            console.error(
                '[Auth] Session check failed:',
                error
            );
            return;
        }

        if (session?.user) {
            await redirectHome();
        }

    } catch (error) {
        console.error(
            '[Auth] Session check exception:',
            error
        );
    }
}


/* =========================
   LOGIN / SIGNUP
========================= */

loginTab?.addEventListener('click', () => {
    setMode('login');
});

signupTab?.addEventListener('click', () => {
    setMode('signup');
});


/* =========================
   FORGOT PASSWORD
========================= */

forgotPasswordBtn?.addEventListener(
    'click',
    openForgotPanel
);

backToLoginBtn?.addEventListener(
    'click',
    closeForgotPanel
);


/* =========================
   PASSWORD VISIBILITY
========================= */

passwordToggle?.addEventListener('click', () => {

    if (!password) return;

    const showing =
        password.type === 'text';

    password.type =
        showing ? 'password' : 'text';

    passwordToggle.textContent =
        showing ? '👁' : '🙈';

    passwordToggle.setAttribute(
        'aria-label',
        showing
            ? 'Show password'
            : 'Hide password'
    );
});


/* =========================
   LOGIN / SIGNUP SUBMIT
========================= */

form?.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();
        clearMessage();

        const emailValue =
            email?.value.trim() || '';

        const passwordValue =
            password?.value || '';

        if (!emailValue || !passwordValue) {
            showMessage(
                'Enter your email and password.',
                'error'
            );
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;

            submitBtn.textContent =
                mode === 'signup'
                    ? 'CREATING ACCOUNT...'
                    : 'AUTHENTICATING...';
        }

        try {

            /* SIGN UP */

            if (mode === 'signup') {

                const detectiveName =
                    displayName?.value.trim() || '';

                if (!detectiveName) {
                    throw new Error(
                        'Enter your detective name.'
                    );
                }

                const { data, error } =
                    await supabase.auth.signUp({

                        email: emailValue,

                        password: passwordValue,

                        options: {
                            data: {
                                display_name:
                                    detectiveName
                            }
                        }
                    });

                if (error) {
                    throw error;
                }

                const user =
                    data?.user ??
                    data?.session?.user;

                if (user) {

                    await createProfile(
                        user.id,
                        detectiveName,
                        emailValue
                    );
                }

                if (data?.session) {

                    await redirectHome();
                    return;
                }

                showMessage(
                    'Account created. Check your email and confirm your account, then return here and log in.',
                    'success'
                );

                setMode('login');
                return;
            }


            /* LOGIN */

            const { data, error } =
                await supabase.auth
                    .signInWithPassword({

                        email: emailValue,

                        password: passwordValue
                    });

            if (error) {
                throw error;
            }

            if (!data?.session) {

                throw new Error(
                    'Login succeeded, but no active session was created. Please try again.'
                );
            }

            await redirectHome();

        } catch (error) {

            console.error(
                '[Auth] Authentication error:',
                error
            );

            showMessage(
                error.message ||
                'Authentication failed.',
                'error'
            );

        } finally {

            if (submitBtn) {

                submitBtn.disabled = false;

                submitBtn.textContent =
                    mode === 'signup'
                        ? 'CREATE DETECTIVE ACCOUNT'
                        : 'ENTER HEADQUARTERS';
            }
        }
    }
);


/* =========================
   PASSWORD RESET REQUEST
========================= */

forgotForm?.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();
        clearMessage();

        const emailValue =
            forgotEmail?.value.trim() || '';

        if (!emailValue) {

            showMessage(
                'Enter your account email.',
                'error'
            );

            return;
        }

        if (forgotSubmitBtn) {

            forgotSubmitBtn.disabled = true;

            forgotSubmitBtn.textContent =
                'SENDING...';
        }

        try {

            /*
             * This is your EXISTING
             * reset-password.html page.
             */

            const resetUrl =
                new URL(
                    '/reset-password.html',
                    window.location.origin
                ).href;

            const { error } =
                await supabase.auth
                    .resetPasswordForEmail(
                        emailValue,
                        {
                            redirectTo:
                                resetUrl
                        }
                    );

            if (error) {
                throw error;
            }

            showMessage(
                'Password reset link sent. Check your email and open the link to set a new password.',
                'success'
            );

            if (forgotForm) {
                forgotForm.reset();
            }

        } catch (error) {

            console.error(
                '[Auth] Password reset request failed:',
                error
            );

            showMessage(
                error.message ||
                'Unable to send the password reset link.',
                'error'
            );

        } finally {

            if (forgotSubmitBtn) {

                forgotSubmitBtn.disabled = false;

                forgotSubmitBtn.textContent =
                    'SEND RESET LINK';
            }
        }
    }
);


/* =========================
   GOOGLE LOGIN
========================= */

googleBtn?.addEventListener(
    'click',
    async () => {

        clearMessage();

        googleBtn.disabled = true;

        const label =
            $('googleBtnLabel');

        if (label) {
            label.textContent =
                'CONNECTING...';
        }

        try {

            const { error } =
                await supabase.auth
                    .signInWithOAuth({

                        provider: 'google',

                        options: {
                            redirectTo:
                                new URL(
                                    'home.html',
                                    window.location.href
                                ).href
                        }
                    });

            if (error) {
                throw error;
            }

        } catch (error) {

            console.error(
                '[Auth] Google authentication error:',
                error
            );

            showMessage(
                error.message ||
                'Google authentication failed.',
                'error'
            );

            googleBtn.disabled = false;

            if (label) {
                label.textContent =
                    'Continue with Google';
            }
        }
    }
);


/* =========================
   INITIALIZE
========================= */

setMode('login');

checkSession(); 