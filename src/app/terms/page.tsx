"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-white/60 mb-8">Last updated: February 21, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/70 leading-relaxed">
              By accessing or using LinImpact.ai ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-white/70 leading-relaxed">
              LinImpact.ai is an AI-powered resume builder platform that helps users create professional resumes, cover letters, and prepare for job interviews. Our Service includes resume templates, AI content generation, ATS optimization, LinkedIn import, and interview preparation tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="text-white/70 leading-relaxed mb-4">When you create an account with us, you must:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Provide accurate, complete, and current information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              You may not use another person's account without permission. We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Free Service</h2>
            <p className="text-white/70 leading-relaxed">
              LinImpact.ai is a completely free service. All features — including AI resume building, cover letter generation, ATS optimization, interview prep, and unlimited exports — are available at no cost. We reserve the right to modify the availability of features with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. User Content</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              You retain ownership of all content you create using our Service. By using our Service, you grant us a limited license to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Store and process your content to provide the Service</li>
              <li>Use AI to generate suggestions based on your content</li>
              <li>Create backups for data protection purposes</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              We do not use your personal resume content to train AI models or share it with third parties except as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibited Uses</h2>
            <p className="text-white/70 leading-relaxed mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Create false, misleading, or fraudulent resume content</li>
              <li>Impersonate another person or entity</li>
              <li>Upload malicious code or attempt to compromise our systems</li>
              <li>Scrape, copy, or redistribute our content without permission</li>
              <li>Use automated systems to access the Service without our consent</li>
              <li>Interfere with or disrupt the Service or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. AI-Generated Content</h2>
            <p className="text-white/70 leading-relaxed">
              Our Service uses artificial intelligence to generate suggestions and content. While we strive for accuracy, AI-generated content may contain errors or inconsistencies. You are responsible for reviewing and verifying all content before using it in your job applications. We do not guarantee that AI-generated content will result in job interviews or employment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p className="text-white/70 leading-relaxed">
              The Service and its original content (excluding user content), features, and functionality are owned by LinImpact.ai and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Our templates, designs, and AI technology remain our property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-white/70 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE DO NOT GUARANTEE EMPLOYMENT OUTCOMES OR THAT YOUR RESUME WILL PASS ALL ATS SYSTEMS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
            <p className="text-white/70 leading-relaxed">
              IN NO EVENT SHALL LINIMPACT.AI, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR EMPLOYMENT OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Indemnification</h2>
            <p className="text-white/70 leading-relaxed">
              You agree to defend, indemnify, and hold harmless LinImpact.ai and its affiliates from any claims, damages, obligations, losses, liabilities, costs, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Termination</h2>
            <p className="text-white/70 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately. You may request export of your data before termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p className="text-white/70 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Governing Law</h2>
            <p className="text-white/70 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LinImpact.ai operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-white/70 mt-4">
              <strong className="text-white">Email:</strong> legal@linimpact.ai<br />
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
