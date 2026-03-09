import React from 'react';
import Navigation from '../components/Navigation';
import { Card } from '@/components/ui/card';

export const isPublic = true;

export default function TermsOfService() {
  const siteName = window.location.hostname.split('.')[0].charAt(0).toUpperCase() + window.location.hostname.split('.')[0].slice(1);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-8 md:p-12 bg-white">
          <h1 className="text-4xl font-bold text-[#1e3a5f] mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 22, 2025</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using {siteName}'s platform and services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited 
                from using our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">2. Description of Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {siteName} provides a platform that connects:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Homeowners seeking to manage properties and find services</li>
                <li>Service providers offering home maintenance and improvement services</li>
                <li>Buyers and sellers of real estate</li>
                <li>Property owners and renters</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We provide tools for property digitization, AI-powered insights, deal posting, service booking, 
                and communication between parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3.1 Registration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must create an account to access certain features. You agree to provide accurate, current, and 
                complete information and to update it as necessary.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">3.2 Account Security</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account. Notify us immediately of any unauthorized use.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">3.3 Account Types</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Homeowners:</strong> Can digitize properties, post deals, and book services</li>
                <li><strong>Service Providers:</strong> Can create service listings, receive leads, and accept bookings</li>
                <li><strong>Admin:</strong> Platform administrators with additional privileges</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">4. User Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Post false, misleading, or fraudulent information</li>
                <li>Impersonate any person or entity</li>
                <li>Harass, threaten, or intimidate other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to the platform</li>
                <li>Use automated tools to scrape or collect data</li>
                <li>Post spam or unsolicited advertisements</li>
                <li>Infringe on intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">5. Property and Service Listings</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">5.1 Content Accuracy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are solely responsible for the accuracy of all property information, service descriptions, and 
                deal listings you post. We do not verify the accuracy of user-generated content.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">5.2 Prohibited Listings</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Listings that are illegal, fraudulent, discriminatory, or violate fair housing laws are strictly prohibited.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">5.3 Removal Rights</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to remove any listing that violates these terms or our community standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">6. Service Provider Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">6.1 Lead Fees</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Service providers are charged a fee for qualified leads. The default fee is $10 per lead, but custom 
                arrangements may be available. Payment terms are net 30 days unless otherwise agreed.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">6.2 Professional Standards</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Service providers must maintain appropriate licenses, insurance, and professional certifications required 
                by their jurisdiction. You agree to perform services in a professional and workmanlike manner.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">6.3 Independent Contractor</h3>
              <p className="text-gray-700 leading-relaxed">
                Service providers are independent contractors, not employees of {siteName}. We do not control how you 
                perform your services or set your rates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">7. Transactions and Payments</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">7.1 Payment Processing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Payments are processed through Stripe. By making a payment, you agree to Stripe's terms of service.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">7.2 Platform Role</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {siteName} is a platform that connects parties but is not a party to transactions between users. 
                We do not guarantee the quality of services or properties.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">7.3 Refunds</h3>
              <p className="text-gray-700 leading-relaxed">
                Service deal purchases are subject to the refund policy specified in the deal listing. Lead fees 
                are non-refundable except in cases of demonstrable platform error.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">8. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">8.1 Platform Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All content on the platform, including design, logos, and software, is owned by {siteName} and protected 
                by intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">8.2 User Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of content you post but grant {siteName} a worldwide, non-exclusive license to use, 
                display, and distribute your content on the platform.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">8.3 AI-Generated Content</h3>
              <p className="text-gray-700 leading-relaxed">
                AI-generated insights, recommendations, and videos are provided for informational purposes. You may use 
                this content for your properties and services as outlined in your account type.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">9. Disclaimers</h2>
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>We do not guarantee uninterrupted or error-free service</li>
                  <li>We do not verify the credentials of service providers</li>
                  <li>We do not guarantee the accuracy of property valuations or AI insights</li>
                  <li>We are not responsible for disputes between users</li>
                  <li>We do not guarantee that deals or services meet your requirements</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">10. Limitation of Liability</h2>
              <div className="p-4 bg-red-50 border-l-4 border-red-400">
                <p className="text-gray-700 leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, {siteName.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
                  DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">11. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless {siteName} from any claims, damages, losses, liabilities, and 
                expenses arising from your use of the platform, violation of these terms, or infringement of any rights 
                of another party.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">12. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may suspend or terminate your account at any time for violation of these terms. You may terminate 
                your account at any time by contacting us. Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Your right to use the platform ceases immediately</li>
                <li>We may delete your account and data after 30 days</li>
                <li>Outstanding payment obligations remain in effect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">13. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">13.1 Informal Resolution</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Before filing a claim, you agree to contact us to attempt to resolve the dispute informally.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">13.2 Arbitration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any disputes not resolved informally shall be resolved through binding arbitration in accordance with 
                the rules of the American Arbitration Association.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">13.3 Class Action Waiver</h3>
              <p className="text-gray-700 leading-relaxed">
                You agree to bring claims only in your individual capacity and not as part of a class action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">14. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These terms are governed by the laws of the United States and the state in which {siteName} is 
                incorporated, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">15. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may modify these terms at any time. We will notify users of material changes via email or platform 
                notification. Continued use after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-3">16. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@{window.location.hostname}<br />
                  <strong>Website:</strong> {window.location.hostname}
                </p>
              </div>
            </section>

            <section className="mt-8 pt-8 border-t">
              <p className="text-sm text-gray-600 italic">
                By using {siteName}, you acknowledge that you have read, understood, and agree to be bound by these 
                Terms of Service.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}