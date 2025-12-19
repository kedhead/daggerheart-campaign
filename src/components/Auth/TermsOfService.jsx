import { useState } from 'react';
import './TermsOfService.css';

export default function TermsOfService({ onAccept, onDecline }) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <div className="terms-overlay">
      <div className="terms-modal">
        <div className="terms-header">
          <h2>Terms of Service & End User License Agreement</h2>
          <p className="terms-date">Last Updated: December 19, 2025</p>
        </div>

        <div className="terms-content">
          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using Lorelich ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h3>2. Description of Service</h3>
            <p>
              Lorelich is a campaign management tool for tabletop role-playing games. The Service allows users to create, manage, and share campaign content including characters, lore, sessions, and other game-related materials.
            </p>
          </section>

          <section>
            <h3>3. User-Generated Content</h3>
            <p>
              <strong>YOU ARE SOLELY RESPONSIBLE FOR ALL CONTENT YOU CREATE, UPLOAD, OR SHARE THROUGH THE SERVICE.</strong> This includes but is not limited to:
            </p>
            <ul>
              <li>Campaign descriptions and narratives</li>
              <li>Character information and backstories</li>
              <li>Lore entries and world-building content</li>
              <li>Session notes and summaries</li>
              <li>Images, maps, and files uploaded to campaigns</li>
              <li>Messages and communications with other users</li>
            </ul>
            <p>
              Lorelich and its operators are <strong>NOT RESPONSIBLE</strong> for any content created or shared by users within their campaigns. Users agree to:
            </p>
            <ul>
              <li>Not upload content that is illegal, offensive, harassing, or violates the rights of others</li>
              <li>Not share copyrighted material without proper authorization</li>
              <li>Not use the Service to harm, threaten, or harass other users</li>
              <li>Respect the intellectual property rights of others</li>
            </ul>
          </section>

          <section>
            <h3>4. Content Moderation</h3>
            <p>
              While Lorelich reserves the right to monitor and remove content that violates these terms, we are under no obligation to do so. Users should report inappropriate content through proper channels. The presence of moderation tools does not make Lorelich responsible for user-generated content.
            </p>
          </section>

          <section>
            <h3>5. Disclaimer of Warranties</h3>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. Lorelich makes no warranties, expressed or implied, regarding:
            </p>
            <ul>
              <li>The accuracy, reliability, or availability of the Service</li>
              <li>The security of user data (though reasonable efforts are made)</li>
              <li>Uninterrupted or error-free operation</li>
              <li>The content created by other users</li>
            </ul>
          </section>

          <section>
            <h3>6. Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LORELICH AND ITS OPERATORS SHALL NOT BE LIABLE FOR:
            </p>
            <ul>
              <li>Any user-generated content or actions taken by users</li>
              <li>Loss of data or campaign information</li>
              <li>Damages arising from disputes between users</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section>
            <h3>7. User Accounts</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h3>8. Termination</h3>
            <p>
              Lorelich reserves the right to suspend or terminate accounts that violate these terms or engage in harmful behavior. Users may delete their accounts at any time.
            </p>
          </section>

          <section>
            <h3>9. Privacy</h3>
            <p>
              User data is stored securely using Firebase services. By using the Service, you consent to the collection and use of information as described in our data practices. We do not sell user data to third parties.
            </p>
          </section>

          <section>
            <h3>10. Changes to Terms</h3>
            <p>
              Lorelich reserves the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h3>11. Governing Law</h3>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h3>12. Contact</h3>
            <p>
              For questions about these terms, please contact us through the GitHub repository at: <a href="https://github.com/kedhead/daggerheart-campaign" target="_blank" rel="noopener noreferrer">github.com/kedhead/daggerheart-campaign</a>
            </p>
          </section>
        </div>

        <div className="terms-footer">
          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>I have read and agree to the Terms of Service and EULA</span>
          </label>

          <div className="terms-actions">
            <button
              className="btn btn-secondary"
              onClick={onDecline}
            >
              Decline
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAccept}
              disabled={!accepted}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
