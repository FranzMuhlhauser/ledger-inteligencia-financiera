import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Load env
const SUPABASE_URL = 'https://hbyznxecemltuqkfeecd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhieXpueGVjZW1sdHVxa2ZlZWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDc0OTYsImV4cCI6MjA5MDEyMzQ5Nn0.xD6AcsTwUB7tV0rybDRdeRPwqj7qZLke4Ao5Y9GKeyY';
const GEMINI_API_KEY = 'AIzaSyBHFeWdHct5ch2TYe58inzoC89-drlbxIg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function testSupabaseSearch() {
  console.log('\n🔍 Testing Supabase search_invoices function...');
  try {
    const { data, error } = await supabase.rpc('search_invoices', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_search_query: null,
      p_limit: 1,
      p_offset: 0,
    });

    if (error && error.message.includes('function does not exist')) {
      console.log('❌ Function search_invoices does NOT exist');
      console.log('   → You need to run supabase-server-search.sql in Supabase SQL Editor');
      return false;
    } else if (error) {
      console.log('⚠️  Function exists but returned error:', error.message);
      return true;
    } else {
      console.log('✅ Function search_invoices EXISTS and is working');
      return true;
    }
  } catch (err) {
    console.log('❌ Error testing:', err.message);
    return false;
  }
}

async function testGeminiAI() {
  console.log('\n🤖 Testing Gemini AI API...');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Responde solo "OK" si funciona',
    });

    if (response.text) {
      console.log('✅ Gemini API is working');
      console.log('   Response:', response.text.trim());
      return true;
    } else {
      console.log('❌ Gemini API returned empty response');
      return false;
    }
  } catch (err) {
    console.log('❌ Gemini API error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Ledger Improvements...\n');
  
  const [searchOk, aiOk] = await Promise.all([
    testSupabaseSearch(),
    testGeminiAI(),
  ]);

  console.log('\n📊 Results:');
  console.log('═══════════════════════════════');
  console.log('Búsqueda en servidor:', searchOk ? '✅ OK' : '❌ FALLÓ');
  console.log('Gemini AI:', aiOk ? '✅ OK' : '❌ FALLÓ');
  console.log('═══════════════════════════════\n');

  if (searchOk && aiOk) {
    console.log('🎉 ¡Todo está funcionando correctamente!');
  } else {
    console.log('⚠️  Algunas funcionalidades necesitan configuración adicional');
  }
}

main().catch(console.error);
