// Site configuration. Each organisation that runs the kit edits this file.
// Leave supabaseUrl empty to run in demo mode: proposals then stay in this browser.
// Values come from Supabase: Project settings > API. The anon key is meant to be public;
// row-level security in supabase/schema.sql decides what it can read and write.
window.PC_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  // Default space (its slug) when the address has no ?space=...
  space: 'apertus-demo'
};
