import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | DareScore',
  description: 'Terms of Service for DareScore',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using DareScore ("the Service"), you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily access the materials (information or software) on DareScore's
            platform for personal, non-commercial use only. This is the grant of a license, not a transfer of title.
          </p>
          <p>Under this license you may not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to reverse engineer any software contained on DareScore</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Conduct</h2>
          <p>You agree to use the Service in accordance with all applicable laws and regulations. You will NOT:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Post or share content that is illegal, harmful, threatening, abusive, harassing, or defamatory</li>
            <li>Create challenges that involve dangerous activities, alcohol, drugs, self-harm, or violence</li>
            <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
            <li>Upload, post, email, transmit or otherwise make available any material that contains software viruses</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to other accounts, computer systems or networks</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Safety Guidelines</h2>
          <p>
            DareScore is designed for safe, legal challenges only. Users must:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only create and attempt challenges that are safe and legal</li>
            <li>Not create challenges involving dangerous activities, alcohol, drugs, or self-harm</li>
            <li>Use common sense and prioritize personal safety</li>
            <li>Report any unsafe or inappropriate content immediately</li>
          </ul>
          <p className="font-semibold text-red-600 mt-4">
            DareScore is NOT responsible for any injuries, damages, or consequences resulting from challenge attempts.
            Participate at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Content Ownership</h2>
          <p>
            You retain all ownership rights to content you submit, post or display on or through the Service.
            By submitting, posting or displaying content, you grant us a worldwide, non-exclusive, royalty-free
            license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute
            such content in any and all media or distribution methods.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account and refuse any and all current or future
            use of the Service for any reason at any time. Such termination will result in the deactivation or
            deletion of your Account and the forfeiture of all content in your Account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimer</h2>
          <p>
            The materials on DareScore are provided on an 'as is' basis. DareScore makes no warranties, expressed
            or implied, and hereby disclaims and negates all other warranties including, without limitation, implied
            warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitations</h2>
          <p>
            In no event shall DareScore or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability
            to use the materials on DareScore, even if DareScore or a DareScore authorized representative has been
            notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
          <p>
            DareScore may revise these terms of service at any time without notice. By using this platform you are
            agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="font-semibold">support@darescore.com</p>
        </section>
      </div>
    </div>
  )
}
