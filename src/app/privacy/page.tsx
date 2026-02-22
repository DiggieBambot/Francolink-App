export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, use our services, or communicate with us.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">3. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as described in this privacy policy.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">4. Data Security</h2>
        <p>We use industry-standard security measures to protect your personal information.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">5. Contact Us</h2>
        <p>If you have questions about this privacy policy, please contact us.</p>
      </div>
    </div>
  )
}
