// client.js - Supabase client configuration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Directly use hardcoded values when environment variables aren't available
const SUPABASE_URL = process.env.SUPABASE_URL || "https://iyczdwaacggtaipmehvo.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Y3pkd2FhY2dndGFpcG1laHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Njg0NTMsImV4cCI6MjA1OTU0NDQ1M30.aHKZwHR-RuapbcRlR7BHpwUXYInRLutc5xtRtrfmkXI";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = { supabase };