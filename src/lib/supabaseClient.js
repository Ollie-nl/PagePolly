import { createClient } from '@supabase/supabase-js'

// Gebruik omgevingsvariabelen met VITE_ prefix voor de frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL of Anon Key niet gevonden in omgevingsvariabelen')
}

// Maak een echte Supabase client voor database operaties
const realSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Log een bericht om te laten zien dat we een hybride setup gebruiken
console.log('HYBRIDE SUPABASE CLIENT: Mock auth, echte database');

// Maak een array voor subscribers van authentication events
const authSubscribers = [];

// Maak een hybride Supabase client met mock auth en echte database
const supabaseClient = {
    // Auth methodes (mock)
    auth: {
        // Beheer authenticatie status veranderingen
        onAuthStateChange: (callback) => {
            console.log('Mock onAuthStateChange geregistreerd');
            authSubscribers.push(callback);
            
            // Return een functie om de subscription te verwijderen
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {
                            console.log('Mock unsubscribe van auth state');
                            const index = authSubscribers.indexOf(callback);
                            if (index > -1) {
                                authSubscribers.splice(index, 1);
                            }
                        }
                    }
                }
            };
        },
        
        // Modern Supabase gebruikt signInWithPassword
        signInWithPassword: async ({ email, password }) => {
            console.log('Mock login met:', email);
            const mockSession = {
                user: { email, id: 'mock-user-id' },
                access_token: 'mock-token'
            };
            
            // Trigger alle subscribers
            setTimeout(() => {
                authSubscribers.forEach(callback => callback('SIGNED_IN', mockSession));
            }, 100);
            
            return {
                data: {
                    user: mockSession.user,
                    session: mockSession
                },
                error: null
            };
        },
        
        // Behoud ook signIn voor backward compatibility
        signIn: async ({ email, password }) => {
            console.log('Mock login (legacy) met:', email);
            return supabaseClient.auth.signInWithPassword({ email, password });
        },
        
        signUp: async ({ email, password }) => {
            console.log('Mock registratie met:', email);
            const mockSession = {
                user: { email, id: 'mock-user-id' },
                access_token: 'mock-token'
            };
            
            // Trigger alle subscribers
            setTimeout(() => {
                authSubscribers.forEach(callback => callback('SIGNED_IN', mockSession));
            }, 100);
            
            return {
                data: {
                    user: mockSession.user,
                    session: mockSession
                },
                error: null
            };
        },
        
        signOut: async () => {
            console.log('Mock uitloggen');
            
            // Trigger alle subscribers
            setTimeout(() => {
                authSubscribers.forEach(callback => callback('SIGNED_OUT', null));
            }, 100);
            
            return { error: null };
        },
        
        getUser: async () => {
            console.log('Mock gebruiker ophalen');
            return {
                data: {
                    user: { email: 'test@example.com', id: 'mock-user-id' }
                },
                error: null
            };
        },
        
        getSession: async () => {
            console.log('Mock sessie ophalen');
            return {
                data: {
                    session: {
                        user: { email: 'test@example.com', id: 'mock-user-id' },
                        access_token: 'mock-token'
                    }
                },
                error: null
            };
        }
    },
    
    // Database methodes (echte Supabase)
    from: (table) => {
        console.log(`Echte database query op tabel: ${table}`);
        return realSupabaseClient.from(table);
    },
    
    // Storage methodes (echte Supabase)
    storage: realSupabaseClient.storage
};

export default supabaseClient;
