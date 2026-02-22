import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | DareScore',
  description: 'Privacy Policy for DareScore',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to DareScore ("we," "our," or "us"). We are committed to protecting your personal information
            and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
          <p>We collect personal information that you voluntarily provide to us when you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Register for an account (email, username, name)</li>
            <li>Update your profile (avatar, bio)</li>
            <li>Create challenges or attempts</li>
            <li>Send messages to other users</li>
            <li>Report content or users</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
          <p>When you use our platform, we automatically collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device information (browser type, operating system)</li>
            <li>IP address and location data</li>
            <li>Usage data (pages visited, time spent, features used)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 User-Generated Content</h3>
          <p>We collect content you create and upload:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Challenge descriptions and details</li>
            <li>Photos and videos (proof submissions)</li>
            <li>Comments and messages</li>
            <li>Verification votes and feedback</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, operate, and maintain our platform</li>
            <li>Process your transactions and manage your account</li>
            <li>Send you notifications about your activity</li>
            <li>Communicate with you about updates or support</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Enforce our Terms of Service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Information Sharing and Disclosure</h2>
          <p>We may share your information with:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Other Users</h3>
          <p>Your profile, challenges, attempts, and messages are visible to other users based on your privacy settings.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Service Providers</h3>
          <p>We may share your information with third-party service providers who help us operate our platform:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cloud hosting providers</li>
            <li>Analytics providers</li>
            <li>Email service providers</li>
            <li>Payment processors</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Legal Requirements</h3>
          <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information.
            However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot
            guarantee absolute security.
          </p>
          <p className="mt-4">Security measures include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit (HTTPS/SSL)</li>
            <li>Secure password hashing</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
            <li>Monitoring for suspicious activity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Objection:</strong> Object to processing of your data</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us at <strong>privacy@darescore.com</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Retention</h2>
          <p>
            We retain your personal information only for as long as necessary to fulfill the purposes outlined in
            this Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>
          <p className="mt-4">When you delete your account:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your profile and personal information will be permanently deleted</li>
            <li>Your public content may remain visible but will be anonymized</li>
            <li>Some data may be retained for legal or security purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
          <p>
            Our platform is not intended for children under 13 years of age. We do not knowingly collect personal
            information from children under 13. If you are a parent or guardian and believe your child has provided
            us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and maintained on computers located outside of your state, province,
            country or other governmental jurisdiction where the data protection laws may differ. If you are located
            outside the United States and choose to provide information to us, we transfer the information to the
            United States and process it there.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar tracking technologies to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Keep you signed in</li>
            <li>Remember your preferences</li>
            <li>Understand how you use our platform</li>
            <li>Improve your experience</li>
          </ul>
          <p className="mt-4">
            You can control cookies through your browser settings. However, disabling cookies may affect your ability
            to use certain features of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
            new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this
            Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="list-none space-y-2 mt-4">
            <li><strong>Email:</strong> privacy@darescore.com</li>
            <li><strong>Support:</strong> support@darescore.com</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-semibold mb-4">GDPR Notice (EU Users)</h2>
          <p>
            If you are in the European Economic Area (EEA), you have specific rights under the General Data
            Protection Regulation (GDPR). We are committed to complying with GDPR requirements.
          </p>
          <p className="mt-4">
            <strong>Legal Basis for Processing:</strong> We process your data based on consent, contract performance,
            legal obligations, and legitimate interests.
          </p>
        </section>

        <section className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg mt-4">
          <h2 className="text-2xl font-semibold mb-4">CCPA Notice (California Users)</h2>
          <p>
            If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Right to know what personal information is collected</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of the sale of personal information (we do not sell your information)</li>
            <li>Right to non-discrimination for exercising your rights</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
