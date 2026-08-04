console.log("🚨 TEST FILE LOADED");

import { supabase } from './supabase.js';

async function testSupabase() {
    console.log("🔍 Testing Supabase connection...");

    const { data, error } = await supabase
        .from('units')
        .select('id, title')
        .order('order_index');

    if (error) {
        console.error("❌ SUPABASE ERROR:", error);
        return;
    }

    console.log("✅ SUPABASE CONNECTED!");
    console.table(data);
}

testSupabase();