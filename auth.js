import { supabase } from './supabase.js';

console.log('[Auth] Auth module loaded');

const form = document.getElementById('authForm');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const nameField = document.getElementById('nameField');
const displayName = document.getElementById('displayName');
const email = document.getElementById('email');
const password = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const message = document.getElementById('message');

if (!form || !loginTab || !signupTab || !nameField || !displayName || !email || !password || !submitBtn || !message) {
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

    function setMode(newMode) {
        mode = newMode;
        clearMessage();

        if (mode === 'login') {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');

            nameField.style.display = 'none';
            displayName.required = false;
            password.autocomplete = 'current-password';
            submitBtn.textContent = 'ENTER HEADQUARTERS';
        } else {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');

            nameField.style.display = 'block';
            displayName.required = true;
            password.autocomplete = 'new-password';
            submitBtn.textContent = 'CREATE DETECTIVE ACCOUNT';
        }
    }

    async function redirectIfSessionExists() {
        const {
            data: { session },
            error
        } = await supabase.auth.getSession();

        if (error) {
            console.error('[Auth] Session check failed:', error);
            return;
        }

        if (session?.user) {
            console.log('[Auth] Existing session detected. Redirecting to /home.html');
            window.location.replace(new URL('home.html', window.location.href).href);
        }
    }

    loginTab.addEventListener('click', () => {
        setMode('login');
    });

    signupTab.addEventListener('click', () => {
        setMode('signup');
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();

        const emailValue = email.value.trim();
        const passwordValue = password.value;

        if (!emailValue || !passwordValue) {
            showMessage('Enter your email and password.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = mode === 'login' ? 'AUTHENTICATING...' : 'CREATING ACCOUNT...';

        try {
            if (mode === 'signup') {
                console.log('[Auth] Signup attempt started');

                const detectiveName = displayName.value.trim();

                if (!detectiveName) {
                    showMessage('Enter your detective name.', 'error');
                    return;
                }

                const { data, error } = await supabase.auth.signUp({
                    email: emailValue,
                    password: passwordValue,
                    options: {
                        data: {
                            display_name: detectiveName
                        }
                    }
                });
                const user = data?.user ?? data?.session?.user;

if (user) {
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            username: detectiveName,
            email: emailValue
        });

    if (profileError) {
        console.error('[Profile]', profileError);
    }
}
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

const user = data?.user ?? data?.session?.user;

if (user) {
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            username: detectiveName,
            email: emailValue
        });

    if (profileError) {
        console.error('[Profile]', profileError);
    }
}




                console.log('[Auth] Signup result: user=' + (data?.user?.id ? 'present' : 'absent') + ', session=' + (data?.session ? 'present' : 'absent'));
                console.log('[Auth] Signup error:', error?.message || error);

                if (error) {
                    throw error;
                }

                if (!data.session) {
                    showMessage(
                        'Account created. Check your email and confirm your account, then return here and log in.',
                        'success'
                    );
                    setMode('login');
                    return;
                }

                const {
                    data: { session },
                    error: sessionError
                } = await supabase.auth.getSession();

                console.log('[Auth] Session after signup:', session);

                if (sessionError) {
                    throw sessionError;
                }

                if (session?.user) {
                    console.log('[Auth] Redirecting to /home.html');
                    window.location.replace(new URL('home.html', window.location.href).href);
                }
            } else {
                console.log('[Auth] Login attempt started');

                const { data, error } = await supabase.auth.signInWithPassword({
                    email: emailValue,
                    password: passwordValue
                });

                console.log('[Auth] Authentication result: user=' + (data?.user?.id ? 'present' : 'absent') + ', session=' + (data?.session ? 'present' : 'absent'));
                console.log('[Auth] Authentication error:', error?.message || error);

                if (error) {
                    showMessage(error.message, 'error');
                    return;
                }

                if (!data?.session) {
                    console.warn('[Auth] Login succeeded but no session was created.');
                    showMessage('Login succeeded, but no active session was created. Please try again.', 'error');
                    return;
                }

                const {
                    data: { session },
                    error: sessionError
                } = await supabase.auth.getSession();

                console.log('[Auth] Session after login:', session);

                if (sessionError) {
                    throw sessionError;
                }

                if (session?.user) {
                    console.log('[Auth] Redirecting to /home.html');
                    window.location.replace(new URL('home.html', window.location.href).href);
                } else {
                    showMessage('Authentication did not create a usable session. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('[Auth] Authentication error:', error);
            showMessage(error.message || 'Authentication failed.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'login' ? 'ENTER HEADQUARTERS' : 'CREATE DETECTIVE ACCOUNT';
        }
    });

    await redirectIfSessionExists();
    setMode('login');
}