// Site configuration for the public Apertus Charter site.
// Leave supabaseUrl empty to run the sample round: input then stays in this browser.
// Values come from Supabase: Project settings > API. The anon key is meant to be public;
// row-level security in supabase/schema.sql decides what it can read and write.
window.PC_CONFIG = {
  supabaseUrl: 'https://qphphvzibsrlzidnazzr.supabase.co',
  supabaseAnonKey: 'sb_publishable_LRejjn8NS1h8NGpS0UZjog_MRvorPz4',
  // Show a field for the 6-digit code from the sign-in email. Only switch this on after adding
  // {{ .Token }} to the "Magic Link" and "Confirm signup" email templates in Supabase.
  emailCode: false,
  // The one public space (its slug), created by supabase/seed.sql
  space: 'apertus'
};
