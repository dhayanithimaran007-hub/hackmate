import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ronqjjeqpvlqhspmpnqe.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbnFqamVxcHZscWhzcG1wbnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMjM2ODksImV4cCI6MjEwNjY5OTY4OX0.wjnoZDOaBIzs6_P6Ax4kk5Kk_sUlnu-_k_TGSzgl6Wc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';
  const fullName = 'Test User';
  
  console.log(`Registering user ${email}...`);
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });
  
  if (authError) {
    console.error('Registration failed:', authError);
    return;
  }
  
  console.log('User registered. User ID:', authData.user.id);
  
  // Wait a moment for trigger to run
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();
    
  if (profileError) {
    console.error('Error fetching profile (might not exist):', profileError);
  } else {
    console.log('Profile created successfully:', profile);
  }
}

testRegistration();
