module.exports = {
  apps: [{
    name: 'francolink',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/Francolink-App',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://biwacllbpdxzdxtmqtpw.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd2FjbGxicGR4emR4dG1xdHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTk1MjEsImV4cCI6MjA4NjA3NTUyMX0.V4j8iqAmFt9wd_I0up44q0MCYKjLszHgw3Y40bMeS9U',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd2FjbGxicGR4emR4dG1xdHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTUyMSwiZXhwIjoyMDg2MDc1NTIxfQ.5wCIs9XmsWykIg-AiZWaFg2koN0GKn_tXrZbXPXRakg',
      NEXT_PUBLIC_APP_URL: 'https://app.francolink.net',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_51PDYluFNAbIzYQSpATPBOWyW6PYQJbdyw73RcBI36nV7zEF3kv4WSGKcRNJ6tJBleS5ojXsdsbwENM5AF4WCvmrj00DqVEE9OB',
      STRIPE_SECRET_KEY: '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',
      STRIPE_WEBHOOK_SECRET: 'whsec_your_secret_here'
    }
  }]
}
