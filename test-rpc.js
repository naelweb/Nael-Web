const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, ...val] = line.split('=');
        if (key && val.length > 0) {
            acc[key.trim()] = val.join('=').trim();
        }
        return acc;
    }, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRPC() {
    try {
        console.log("Testing verify_admin_password with 'admin123'...");
        const res1 = await supabase.rpc('verify_admin_password', { input_password: 'admin123' });
        console.log("Result for 'admin123':", res1);

        console.log("Testing verify_admin_password with 'nael123'...");
        const res2 = await supabase.rpc('verify_admin_password', { input_password: 'nael123' });
        console.log("Result for 'nael123':", res2);
    } catch (err) {
        console.error("Unexpected script error:", err);
    }
}

checkRPC();
