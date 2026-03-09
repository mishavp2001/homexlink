import React from 'react';
import Navigation from '../components/Navigation';
import { Card } from '@/components/ui/card';

export const isPublic = true;

export default function PrivacyPolicy() {
  const siteName = window.location.hostname.split('.')[0].charAt(0).toUpperCase() + window.location.hostname.split('.')[0].slice(1);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-8 md:p-12 bg-white">
          <h1 className="text-4xl font-bold text-[#1e3a5f] mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 22, 2025</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to {siteName}. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, disclose, and safeguard your information when you 
                use our platform, services, and website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Name, email address, and phone number</li>
                <li>Business information (business name, service categories, service areas)</li>
                <li>Property information (addresses, property details, components)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Profile photos and business photos</li>
                <li>Messages and communications through our platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Device information and IP address</li>
                <li>Browser type and operating system</li>
                <li>Usage data and analytics</li>
                <li>Location data (with your permission)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Connect homeowners with service providers</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Generate AI-powered insights and recommendations</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">4. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> With vendors and service providers who perform services on our behalf</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, sale of assets, or acquisition</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Public Listings:</strong> Property and service listings you choose to make public</li>
                <li><strong>With Your Consent:</strong> With your explicit permission for specific purposes</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We do NOT sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">5. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform integrates with third-party services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Stripe:</strong> For payment processing</li>
                <li><strong>Google Services:</strong> For maps and location services</li>
                <li><strong>Twilio:</strong> For SMS verification</li>
                <li><strong>OpenAI:</strong> For AI-powered features</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These services have their own privacy policies governing their use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">6. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information. 
                However, no method of transmission over the internet is 100% secure. We use encryption, secure servers, 
                and regular security audits to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">7. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, contact us at privacy@homexrei.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and comply with 
                legal obligations. When you delete your account, we will delete or anonymize your information within 
                30 days, except where we are required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for children under 18. We do not knowingly collect personal information 
                from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">10. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the 
                new policy on this page and updating the "Last Updated" date. Continued use of our services after 
                changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">11. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this privacy policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@{window.location.hostname}<br />
                  <strong>Website:</strong> {window.location.hostname}
                </p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}