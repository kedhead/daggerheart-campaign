import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Users, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react';
import './CampaignBrowser.css';

export default function CampaignBrowser({ onClose }) {
  const { currentUser } = useAuth();
  const [publicCampaigns, setPublicCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingCampaign, setRequestingCampaign] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // Query public campaigns
    const q = query(
      collection(db, 'campaigns'),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const campaigns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPublicCampaigns(campaigns);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading public campaigns:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const handleRequestJoin = async (campaignId, campaignName) => {
    if (!currentUser) return;

    setRequestingCampaign(campaignId);

    try {
      const campaignRef = doc(db, 'campaigns', campaignId);

      await updateDoc(campaignRef, {
        [`joinRequests.${currentUser.uid}`]: {
          email: currentUser.email,
          displayName: currentUser.displayName || 'Player',
          requestedAt: serverTimestamp(),
          status: 'pending'
        },
        updatedAt: serverTimestamp()
      });

      alert(`Join request sent to "${campaignName}"! The DM will review your request.`);
    } catch (error) {
      console.error('Error sending join request:', error);
      alert('Failed to send join request. Please try again.');
    } finally {
      setRequestingCampaign(null);
    }
  };

  const getJoinRequestStatus = (campaign) => {
    if (!currentUser) return null;

    // Check if already a member
    if (campaign.members?.[currentUser.uid]) {
      return 'member';
    }

    // Check if has pending request
    if (campaign.joinRequests?.[currentUser.uid]) {
      return campaign.joinRequests[currentUser.uid].status;
    }

    return null;
  };

  const getMemberCount = (campaign) => {
    return Object.keys(campaign.members || {}).length;
  };

  const getDMName = (campaign) => {
    const dmId = campaign.dmId;
    return campaign.members?.[dmId]?.displayName || 'Unknown DM';
  };

  if (loading) {
    return (
      <div className="campaign-browser">
        <div className="browser-header">
          <button className="btn btn-icon" onClick={onClose}>
            <ArrowLeft size={20} />
          </button>
          <h2>Browse Campaigns</h2>
        </div>
        <div className="loading-view">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-browser">
      <div className="browser-header">
        <button className="btn btn-icon" onClick={onClose}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2>Browse Campaigns</h2>
          <p className="browser-subtitle">Find and join open campaigns</p>
        </div>
      </div>

      {publicCampaigns.length === 0 ? (
        <div className="empty-state card">
          <p>No public campaigns available at the moment</p>
          <small>Check back later or ask a DM to make their campaign public!</small>
        </div>
      ) : (
        <div className="campaigns-grid">
          {publicCampaigns.map((campaign) => {
            const status = getJoinRequestStatus(campaign);
            const memberCount = getMemberCount(campaign);
            const dmName = getDMName(campaign);

            return (
              <div key={campaign.id} className="public-campaign-card card">
                <div className="campaign-card-header">
                  <h3>{campaign.name}</h3>
                  {status === 'member' && (
                    <span className="status-badge status-member">
                      <CheckCircle size={14} />
                      Member
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="status-badge status-pending">
                      <Clock size={14} />
                      Pending
                    </span>
                  )}
                  {status === 'denied' && (
                    <span className="status-badge status-denied">
                      <XCircle size={14} />
                      Declined
                    </span>
                  )}
                </div>

                {campaign.description && (
                  <p className="campaign-description">{campaign.description}</p>
                )}

                <div className="campaign-meta">
                  <div className="meta-item">
                    <Users size={16} />
                    <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="dm-label">DM:</span>
                    <span>{dmName}</span>
                  </div>
                </div>

                {!status && (
                  <button
                    className="btn btn-primary full-width"
                    onClick={() => handleRequestJoin(campaign.id, campaign.name)}
                    disabled={requestingCampaign === campaign.id}
                  >
                    <UserPlus size={18} />
                    {requestingCampaign === campaign.id ? 'Requesting...' : 'Request to Join'}
                  </button>
                )}

                {status === 'pending' && (
                  <div className="pending-message">
                    Your join request is awaiting DM approval
                  </div>
                )}

                {status === 'member' && (
                  <div className="member-message">
                    You're already a member of this campaign
                  </div>
                )}

                {status === 'denied' && (
                  <div className="denied-message">
                    Your request was declined. You can request again if circumstances change.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
