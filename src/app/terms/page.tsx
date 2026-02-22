export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using Francolink, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">2. Use License</h2>
        <p>Permission is granted to temporarily use Francolink for personal, non-commercial transitory viewing only.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account and password.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">4. Limitation of Liability</h2>
        <p>Francolink shall not be liable for any indirect, incidental, special, consequential or punitive damages.</p>
      </div>
    </div>
  )
}
