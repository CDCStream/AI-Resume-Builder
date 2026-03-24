"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Link href="/" className="text-xl font-bold text-white">
              LinImpact.ai
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-white/60 mb-8">Last updated: February 21, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-white/70 leading-relaxed">
              Welcome to LinImpact.ai ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered resume builder service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="text-white/70 leading-relaxed mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li><strong className="text-white">Account Information:</strong> Name, email address, and password when you create an account</li>
              <li><strong className="text-white">Resume Data:</strong> Professional information you enter including work experience, education, skills, and contact details</li>
              <li><strong className="text-white">Usage Data:</strong> Information about how you interact with our service, including features used and session duration</li>

              <li><strong className="text-white">LinkedIn Data:</strong> Professional information imported from LinkedIn when you use our import feature</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-white/70 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Provide, maintain, and improve our resume builder service</li>
              <li>Generate AI-powered resume suggestions and cover letters</li>
              <li>Calculate ATS compatibility scores</li>
              <li>Provide account management and user authentication</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. AI Processing</h2>
            <p className="text-white/70 leading-relaxed">
              Our service uses artificial intelligence (powered by Anthropic's Claude) to help generate and optimize your resume content. Your resume data is processed by AI to provide suggestions, but we do not use your personal resume content to train AI models. Your data is processed solely to provide you with our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-white/70 leading-relaxed mb-4">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li><strong className="text-white">Service Providers:</strong> Third-party vendors who assist in providing our services (hosting, analytics)</li>
              <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
            <p className="text-white/70 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information. This includes encryption of data in transit and at rest, secure authentication through Supabase, and regular security assessments. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="text-white/70 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. You can request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights</h2>
            <p className="text-white/70 leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
            <p className="text-white/70 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. We use analytics services including Google Analytics and PostHog to understand how users interact with our service. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-white/70 leading-relaxed">
              Our service is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-white/70 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-white/70 mt-4">
              <strong className="text-white">Email:</strong> privacy@linimpact.ai<br />
              <strong className="text-white">Website:</strong> https://www.linimpact.ai
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">© 2026 LinImpact.ai. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-white/60 hover:text-white text-sm transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
