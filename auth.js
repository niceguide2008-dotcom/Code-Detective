import { supabase } from './supabase.js';
import { ensureUserProfile, getPostAuthRoute } from './auth-utils.js';

console.log('[Auth] Auth module loaded');

const form = document.getElementById('authForm');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const nameField = document.getElementById('nameField');
const displayName = document.getElementById('displayName');
const email = document.getElementById('email');
const password = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const submitBtn = document.getElementById('submitBtn');
const message = document.getElementById('message');
const googleBtn = document.getElementById('googleBtn');
const googleBtnLabel = document.getElementById('googleBtnLabel');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const forgotPanel = document.getElementById('forgotPanel');
const forgotForm = document.getElementById('forgotForm');
const forgotEmail = document.getElementById('forgotEmail');
const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');

if (!form || !loginTab || !signupTab || !nameField || !displayName || !email ||
    !password || !passwordToggle || !submitBtn || !message || !googleBtn || !googleBtnLabel ||
    !forgotPasswordBtn || !forgotPanel || !forgotForm || !forgotEmail ||
    !forgotSubmitBtn || !backToLoginBtn) {
    console.error('[Auth] Missing one or more authentication elements on this page.');
} else {
    let mode = 'login';

    function showMessage(text, type) {
        message.textContent = text;
        message.className = type;
    }

    function clearMessage() {
        message.textContent = '';
        message.className = '';
    }

    function setBusy(button, busy, label) {
        if (!button) return;
        button.disabled = busy;
        if (label) button.textContent = label;
    }

    function togglePasswordVisibility() {
        const isHidden = password.type === 'password';
        password.type = isHidden ? 'text' : 'password';
        passwordToggle.textContent = isHidden ? '🙈' : '👁';
        passwordToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    }

    function setMode(newMode) {
        mode = newMode;
        clearMessage();
        loginTab.classList.toggle('active', mode === 'login');
        signupTab.classList.toggle('active', mode === 'signup');
        nameField.style.display = mode === 'login' ? 'none' : 'block';
        displayName.required = mode === 'signup';
        password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
        submitBtn.textContent = mode === 'login' ? 'ENTER HEADQUARTERS' : 'CREATE DETECTIVE ACCOUNT';
        forgotPasswordBtn.style.display = mode === 'login' ? 'inline-block' : 'none';
        // The same real Google OAuth integration is available for both
        // authentication modes. In signup mode, Supabase creates the Auth
        // account if it does not already exist; existing Google accounts are
        // simply signed in and reused.
        googleBtn.style.display = 'flex';
        googleBtnLabel.textContent = mode === 'signup'
            ? 'Sign up with Google'
            : 'Continue with Google';
        document.querySelector('.auth-divider').style.display = 'flex';
    }

    function showForgotPanel() {
        clearMessage();
        form.style.display = 'none';
        googleBtn.style.display = 'none';
        document.querySelector('.auth-divider').style.display = 'none';
        forgotPasswordBtn.style.display = 'none';
        forgotPanel.classList.add('active');
        forgotPanel.setAttribute('aria-hidden', 'false');
        forgotEmail.value = email.value.trim();
        forgotEmail.focus();
    }

    function hideForgotPanel() {
        forgotPanel.classList.remove('active');
        forgotPanel.setAttribute('aria-hidden', 'true');
        form.style.display = 'block';
        setMode('login');
        forgotEmail.value = '';
        email.focus();
    }

    function getGoogleAuthErrorMessage(error) {
        const messageText = String(error?.message || error?.error_description || '').trim();
        const normalized = messageText.toLowerCase();

        if (
            normalized.includes('popup') &&
            (normalized.includes('blocked') || normalized.includes('closed'))
        ) {
            return 'Google authentication was blocked or closed. Allow the authentication window and try again.';
        }
        if (
            normalized.includes('cancel') ||
            normalized.includes('denied') ||
            normalized.includes('access_denied')
        ) {
            return 'Google authentication was cancelled. You can try again whenever you are ready.';
        }
        if (
            normalized.includes('provider') ||
            normalized.includes('oauth') ||
            normalized.includes('google')
        ) {
            return messageText || 'Google authentication could not be completed. Please try again.';
        }
        if (
            normalized.includes('network') ||
            normalized.includes('fetch') ||
            normalized.includes('timeout')
        ) {
            return 'A network error interrupted Google authentication. Check your connection and try again.';
        }

        return messageText || 'Google authentication could not be completed. Please try again.';
    }

    function readOAuthCallbackError() {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        return (
            searchParams.get('error_description') ||
            searchParams.get('error') ||
            hashParams.get('error_description') ||
            hashParams.get('error')
        );
    }

    async function redirectIfSessionExists() {
        const oauthError = readOAuthCallbackError();
        if (oauthError) {
            console.warn('[Auth] OAuth callback returned an error:', oauthError);
            showMessage(getGoogleAuthErrorMessage({ message: oauthError }), 'error');
            window.history.replaceState(
                {},
                document.title,
                window.location.origin
            );
            setMode('login');
            return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('[Auth] Session check failed:', error);
            return;
        }
        if (!session?.user) return;

        try {
            // This is the same profile bootstrap used by email/password signup.
            // A Google-authenticated user receives no role here; admin status
            // remains exclusively controlled by the existing secure role system.
            await ensureUserProfile(supabase, session.user);
            const route = await getPostAuthRoute(supabase);
            window.location.replace(new URL(route, window.location.href).href);
        } catch (error) {
            console.error('[Auth] Existing-session profile bootstrap failed:', error);
            showMessage(
                'Authentication succeeded, but your Code Detective profile could not be initialized. Please try again.',
                'error'
            );
            await supabase.auth.signOut().catch(() => {});
        }
    }

    passwordToggle.addEventListener('click', togglePasswordVisibility);
    loginTab.addEventListener('click', () => setMode('login'));
    signupTab.addEventListener('click', () => setMode('signup'));
    forgotPasswordBtn.addEventListener('click', showForgotPanel);
    backToLoginBtn.addEventListener('click', hideForgotPanel);

    googleBtn.addEventListener('click', async () => {
        clearMessage();
        const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';
        setBusy(googleBtn, true, 'Connecting to Google…');

        try {
            // Supabase owns the OAuth exchange. No Google credentials or
            // passwords are handled by Code Detective.
            const redirectTo = window.location.origin;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account'
                    }
                }
            });

            if (error) throw error;
        } catch (error) {
            console.error('[Auth] Google authentication failed:', error);
            showMessage(
                getGoogleAuthErrorMessage(error),
                'error'
            );
            setBusy(googleBtn, false, label);
        }
    });

    forgotForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();
        const emailValue = forgotEmail.value.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            showMessage('Enter a valid email address.', 'error');
            return;
        }

        setBusy(forgotSubmitBtn, true, 'SENDING RESET LINK…');
        try {
            const redirectTo = new URL('reset-password.html', window.location.href).href;
            const { error } = await supabase.auth.resetPasswordForEmail(emailValue, { redirectTo });
            if (error) throw error;

            // Deliberately use a non-enumerating response so the UI never reveals
            // whether an email address is registered.
            showMessage(
                'If an account exists for that email, a secure reset link has been sent. Check your inbox and spam folder.',
                'success'
            );
        } catch (error) {
            console.error('[Auth] Password reset request failed:', error);
            showMessage(
                error?.message || 'The password reset request could not be completed. Please try again.',
                'error'
            );
        } finally {
            setBusy(forgotSubmitBtn, false, 'SEND RESET LINK');
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();

        const emailValue = email.value.trim();
        const passwordValue = password.value;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            showMessage('Enter a valid email address.', 'error');
            return;
        }
        if (!passwordValue) {
            showMessage('Enter your password.', 'error');
            return;
        }
        if (mode === 'signup' && passwordValue.length < 6) {
            showMessage('Password must contain at least 6 characters.', 'error');
            return;
        }

        setBusy(submitBtn, true, mode === 'login' ? 'AUTHENTICATING…' : 'CREATING ACCOUNT…');

        try {
            let user;

            if (mode === 'signup') {
                const detectiveName = displayName.value.trim();
                if (!detectiveName) {
                    showMessage('Enter your detective name.', 'error');
                    return;
                }

                const { data, error } = await supabase.auth.signUp({
                    email: emailValue,
                    password: passwordValue,
                    options: { data: { display_name: detectiveName } }
                });
                if (error) throw error;

                user = data?.user || data?.session?.user;
                if (user) {
                    await ensureUserProfile(supabase, user, {
                        displayName: detectiveName,
                        email: emailValue
                    });
                }

                if (!data?.session) {
                    showMessage(
                        'Account created. Check your email and confirm your account, then return here and log in.',
                        'success'
                    );
                    setMode('login');
                    return;
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: emailValue,
                    password: passwordValue
                });
                if (error) throw error;
                if (!data?.session?.user) {
                    throw new Error('Authentication did not create a usable session. Please try again.');
                }
                user = data.session.user;
            }

            if (!user) throw new Error('Authentication did not return a user account.');

            await ensureUserProfile(supabase, user);
            const route = await getPostAuthRoute(supabase);
            window.location.replace(new URL(route, window.location.href).href);
        } catch (error) {
            console.error('[Auth] Authentication error:', error);
            showMessage(error?.message || 'Authentication failed. Please try again.', 'error');
        } finally {
            setBusy(
                submitBtn,
                false,
                mode === 'login' ? 'ENTER HEADQUARTERS' : 'CREATE DETECTIVE ACCOUNT'
            );
        }
    });

    // A successful password reset can return to this page with a message.
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'success') {
        showMessage('Password updated successfully. You can now sign in.', 'success');
        window.history.replaceState({}, document.title, new URL('index.html', window.location.href).href);
    }

    await redirectIfSessionExists();
    setMode('login');
}
