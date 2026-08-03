// PM2 config template for a self-hosted (VPS) deployment.
//
// Copy this to `ecosystem.config.js` ON THE SERVER and fill in the real values
// there. `ecosystem.config.js` is gitignored: it must never be committed —
// an earlier version of it leaked live Stripe and Supabase keys to a public
// repo, which is why the values below are read from the environment instead of
// being written inline.
//
// Recommended: put the real values in /etc/francolink.env (chmod 600) and load
// them with `pm2 start ecosystem.config.js --env production` after sourcing
// that file, so secrets never live in a file inside the git working tree.

module.exports = {
  apps: [
    {
      name: "francolink",
      script: "npm",
      args: "start",
      cwd: "/var/www/Francolink-App",
      env: {
        NODE_ENV: "production",

        // Public — safe to expose to the browser.
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,

        // Secret — server only. Never prefix these with NEXT_PUBLIC_.
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      },
    },
  ],
};
