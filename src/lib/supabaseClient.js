import { createClient } from '@supabase/supabase-js'

// Gebruik omgevingsvariabelen met VITE_ prefix voor de frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Controleer en log configuratie informatie voor debugging
console.log('Supabase configuratie:');
console.log('URL beschikbaar:', !!supabaseUrl);
console.log('Anon Key beschikbaar:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL of Anon Key niet gevonden in omgevingsvariabelen')
}

// Uitgebreide configuratie voor de Supabase client
const supabaseOptions = {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'X-Client-Info': 'PagePolly-App'
        }
    }
}

// Maak een echte Supabase client aan met verbeterde configuratie
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Exporteer de client
export default supabaseClient;
