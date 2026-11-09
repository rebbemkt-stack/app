// Conexión con Supabase (la usan la app y el panel).
// Si se dejan vacíos, la app funciona como antes: sin cuentas, guardando solo en el móvil.
// La "anon / publishable key" es pública por diseño: NUNCA pongas aquí la "service_role / secret key".
window.REBBE_CONFIG = {
  supabaseUrl: 'https://wbexxxgbaclmamtnhkja.supabase.co',
  supabaseAnonKey: 'sb_publishable_kD7QoktxxPYyjTjl8AV3yA_zR-Rw5Fb',
};
