import { supabase } from './supabase.js';

const form = document.getElementById('resetForm');
const password = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const button = document.getElementById('resetBtn');
const message = document.getElementById('message');
const back = document.getElementById('backToLogin');

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}

function showInvalid(messageText) {
  form.classList.add('hidden');
  button.classList.add('hidden');
  showMessage(messageText, 'error');
  back.classList.remove('hidden');
}

function showSuccess() {
  form.classList.add('hidden');
  showMessage('Your password has been updated successfully. You can now sign in with your new password.', 'success');
  back.classList.remove('hidden');
}

function hasAuthError() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const description = query.get('error_description') || hash.get('error_description');
  const error = query.get('error') || hash.get('error');
  if (description || error) {
    showInvalid(decodeURIComponent(description || 'This password-reset link is invalid or has expired. Please request a new one.'));
    return true;
  }
  return false;
}

back.addEventListener('click', () => {
  window.location.replace(new URL('index.html', window.location.href).href);
});

if (!hasAuthError()) {
  let recoverySession = null;

  const { data: sessionData } = await supabase.auth.getSession();
  recoverySession = sessionData?.session || null;

  if (!recoverySession) {
    // Supabase can finish exchanging a recovery link asynchronously.
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 2500);
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          recoverySession = session;
          clearTimeout(timeout);
          data.subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  if (!recoverySession) {
    showInvalid('This password-reset link is invalid, expired, or no longer available. Request a new reset link from the login page.');
  } else {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const newPassword = password.value;
      const confirmation = confirmPassword.value;

      if (newPassword.length < 6) {
        showMessage('Password must contain at least 6 characters.', 'error');
        return;
      }
      if (newPassword !== confirmation) {
        showMessage('The passwords do not match.', 'error');
        return;
      }

      button.disabled = true;
      button.textContent = 'UPDATING…';

      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        await supabase.auth.signOut();
        showSuccess();
      } catch (error) {
        console.error('[Auth] Password update failed:', error);
        showMessage(
          error?.message || 'The password could not be updated. Request a fresh reset link and try again.',
          'error'
        );
      } finally {
        button.disabled = false;
        button.textContent = 'UPDATE PASSWORD';
      }
    });
  }
}
