import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase.js';

let pushReady = false;

export async function initAndroidPushNotifications() {
  if (pushReady || Capacitor.getPlatform() !== 'android') return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    await PushNotifications.addListener('registration', async token => {
      const { data:{session} } = await supabase.auth.getSession();
      const userId=session?.user?.id;
      if(!userId) return;
      const { error } = await supabase.from('device_push_tokens').upsert({
        user_id:userId, platform:'android', token:token.value, updated_at:new Date().toISOString()
      },{onConflict:'token'});
      if(error) console.warn('[Push] Token save failed:',error);
    });
    await PushNotifications.addListener('registrationError', err => console.error('[Push] Registration failed',err));
    await PushNotifications.addListener('pushNotificationReceived', notification => console.log('[Push] Received',notification));
    await PushNotifications.addListener('pushNotificationActionPerformed', action => {
      const data=action?.notification?.data||{};
      if(data.assignment_id) location.hash='assignment';
    });
    await PushNotifications.register();
    pushReady=true;
  } catch(error) {
    console.warn('[Push] Plugin/Firebase configuration is not ready yet.', error);
  }
}
