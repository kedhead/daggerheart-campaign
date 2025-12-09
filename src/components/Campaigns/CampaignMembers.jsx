import { useState } from 'react';
import { UserPlus, X, Mail, Shield, User, CheckCircle, XCircle } from 'lucide-react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './CampaignMembers.css';

export default function CampaignMembers({ campaign, currentUserId }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [processingRequest, setProcessingRequest] = useState(null);

  const isDM = campaign.dmId === currentUserId;
  const members = campaign.members || {};
  const joinRequests = campaign.joinRequests || {};

  console.log('CampaignMembers Debug:');
  console.log('Current User ID:', currentUserId);
  console.log('Campaign DM ID:', campaign.dmId);
  console.log('Is DM?', isDM);
  console.log('Members:', members);

  const handleChangeRole = async (uid, newRole) => {
    if (!isDM) {
      alert('Only the DM can change member roles');
      return;
    }

    if (uid === campaign.dmId) {
      alert('Cannot change the role of the campaign creator');
      return;
    }

    try {
      const updatedMembers = { ...members };
      updatedMembers[uid] = {
        ...updatedMembers[uid],
        role: newRole
      };

      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });

      alert(`Member role updated to ${newRole === 'dm' ? 'Co-DM' : 'Player'}`);
    } catch (err) {
      console.error('Error changing role:', err);
      alert('Failed to change member role');
    }
  };

  const handleApproveRequest = async (uid, requestData) => {
    if (!isDM) {
      alert('Only the DM can approve join requests');
      return;
    }

    setProcessingRequest(uid);

    try {
      const updatedMembers = { ...members };
      const updatedRequests = { ...joinRequests };

      // Add user to members
      updatedMembers[uid] = {
        role: 'player',
        email: requestData.email,
        displayName: requestData.displayName,
        joinedAt: serverTimestamp()
      };

      // Remove from join requests
      delete updatedRequests[uid];

      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        members: updatedMembers,
        joinRequests: updatedRequests,
        updatedAt: serverTimestamp()
      });

      alert(`${requestData.displayName} has been added to the campaign!`);
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve join request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDenyRequest = async (uid, requestData) => {
    if (!isDM) {
      alert('Only the DM can deny join requests');
      return;
    }

    setProcessingRequest(uid);

    try {
      const updatedRequests = { ...joinRequests };
      updatedRequests[uid] = {
        ...requestData,
        status: 'denied'
      };

      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        joinRequests: updatedRequests,
        updatedAt: serverTimestamp()
      });

      alert(`Join request from ${requestData.displayName} has been declined.`);
    } catch (err) {
      console.error('Error denying request:', err);
      alert('Failed to deny join request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    if (!isDM) {
      setError('Only the DM can invite players');
      return;
    }

    setInviting(true);
    setError('');

    try {
      // Add email to pending invitations
      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        pendingInvites: arrayUnion(inviteEmail.toLowerCase()),
        updatedAt: serverTimestamp()
      });

      setInviteEmail('');
      alert(`${inviteEmail} has been whitelisted. Share the campaign URL with them so they can sign up and join.`);
    } catch (err) {
      console.error('Error inviting player:', err);
      setError('Failed to add player to whitelist');
    } finally {
      setInviting(false);
    }
  };

  const pendingRequests = Object.entries(joinRequests).filter(
    ([_, request]) => request.status === 'pending'
  );

  return (
    <div className="campaign-members">
      <h3>Campaign Members</h3>

      {isDM && pendingRequests.length > 0 && (
        <div className="join-requests-section">
          <h4>Join Requests ({pendingRequests.length})</h4>
          <div className="join-requests-list">
            {pendingRequests.map(([uid, request]) => (
              <div key={uid} className="join-request-item">
                <div className="request-info">
                  <User size={20} />
                  <div>
                    <span className="request-name">{request.displayName}</span>
                    <span className="request-email">{request.email}</span>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleApproveRequest(uid, request)}
                    disabled={processingRequest === uid}
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDenyRequest(uid, request)}
                    disabled={processingRequest === uid}
                  >
                    <XCircle size={16} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="members-list">
        {Object.entries(members).map(([uid, member]) => (
          <div key={uid} className="member-item">
            <div className="member-icon">
              {member.role === 'dm' ? <Shield size={20} /> : <User size={20} />}
            </div>
            <div className="member-info">
              <span className="member-name">{member.displayName}</span>
              <span className="member-email">{member.email}</span>
            </div>
            <div className="member-actions">
              <span className={`member-role ${member.role}`}>
                {member.role === 'dm' ? (uid === campaign.dmId ? 'Campaign Creator' : 'Co-DM') : 'Player'}
              </span>
              {isDM && uid !== campaign.dmId && (
                <select
                  className="role-select"
                  value={member.role}
                  onChange={(e) => handleChangeRole(uid, e.target.value)}
                >
                  <option value="player">Player</option>
                  <option value="dm">Co-DM</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      {campaign.pendingInvites && campaign.pendingInvites.length > 0 && (
        <div className="pending-invites">
          <h4>Pending Invitations</h4>
          {campaign.pendingInvites.map((email, index) => (
            <div key={index} className="pending-invite-item">
              <Mail size={16} />
              <span>{email}</span>
            </div>
          ))}
        </div>
      )}

      {isDM && (
        <form onSubmit={handleInvite} className="invite-form">
          <h4>Invite Player</h4>
          {error && <div className="error-message">{error}</div>}

          <div className="invite-notice">
            <Mail size={20} />
            <div>
              <strong>How invitations work:</strong>
              <p>Enter the player's email address below. You'll need to send them the campaign link manually (copy the URL from your browser). When they sign up or log in with the invited email address, they'll automatically be added to this campaign as a player.</p>
            </div>
          </div>

          <div className="input-group">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="player@email.com"
              required
              disabled={inviting}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inviting}
            >
              <UserPlus size={18} />
              {inviting ? 'Inviting...' : 'Add to Whitelist'}
            </button>
          </div>
          <p className="invite-instructions">
            <strong>Campaign URL to share:</strong><br/>
            {window.location.origin}
          </p>
        </form>
      )}
    </div>
  );
}
