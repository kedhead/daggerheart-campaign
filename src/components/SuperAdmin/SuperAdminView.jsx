import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Users, Lock, Globe, Calendar, User, Trash2, RefreshCw } from 'lucide-react';
import './SuperAdminView.css';

export default function SuperAdminView({ onViewCampaign }) {
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Fetch all campaigns (superadmin can read all)
    setLoading(true);
    const q = query(
      collection(db, 'campaigns'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllCampaigns(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading campaigns:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [refreshTrigger]);

  const getMemberCount = (campaign) => {
    if (!campaign.members) return 0;
    return Object.keys(campaign.members).length;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleDeleteCampaign = async (campaign) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${campaign.name}"?\n\nThis will permanently delete all characters, lore, and sessions in this campaign. This action cannot be undone.`
    );

    if (confirmed) {
      try {
        // Delete all subcollections first
        const subcollections = [
          'characters', 'lore', 'sessions', 'npcs', 'timelineEvents',
          'locations', 'encounters', 'notes', 'campaignFrame',
          'campaignFrameDraft', 'maps', 'files', 'conversations'
        ];

        console.log(`Deleting campaign ${campaign.id} and all subcollections...`);

        // Delete each subcollection
        for (const subcollectionName of subcollections) {
          const subcollectionRef = collection(db, 'campaigns', campaign.id, subcollectionName);
          const subcollectionSnapshot = await getDocs(subcollectionRef);

          console.log(`Deleting ${subcollectionSnapshot.size} documents from ${subcollectionName}`);

          // Delete all documents in the subcollection
          const deletePromises = subcollectionSnapshot.docs.map(docSnap => {
            // If it's conversations, also delete messages subcollection
            if (subcollectionName === 'conversations') {
              return deleteConversationAndMessages(campaign.id, docSnap.id);
            }
            return deleteDoc(docSnap.ref);
          });

          await Promise.all(deletePromises);
        }

        // Finally delete the campaign document itself
        await deleteDoc(doc(db, 'campaigns', campaign.id));
        console.log(`Campaign ${campaign.id} deleted successfully`);

        // Remove from local state immediately
        setAllCampaigns(prev => prev.filter(c => c.id !== campaign.id));

        alert('Campaign deleted successfully!');
      } catch (error) {
        console.error('Error deleting campaign:', error);
        alert(`Failed to delete campaign: ${error.message}`);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const deleteConversationAndMessages = async (campaignId, conversationId) => {
    // Delete all messages in the conversation
    const messagesRef = collection(db, 'campaigns', campaignId, 'conversations', conversationId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);

    const deletePromises = messagesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    // Delete the conversation document
    await deleteDoc(doc(db, 'campaigns', campaignId, 'conversations', conversationId));
  };

  if (loading) {
    return (
      <div className="superadmin-view">
        <h1>SuperAdmin Dashboard</h1>
        <p>Loading all campaigns...</p>
      </div>
    );
  }

  return (
    <div className="superadmin-view">
      <div className="superadmin-header">
        <div className="header-content">
          <div>
            <h1>SuperAdmin Dashboard</h1>
            <p className="superadmin-subtitle">
              Monitoring {allCampaigns.length} total campaigns
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="campaigns-table">
        <table>
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Game System</th>
              <th>Visibility</th>
              <th>Members</th>
              <th>Created By</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allCampaigns.map(campaign => (
              <tr key={campaign.id}>
                <td>
                  <div className="campaign-name">
                    {campaign.name}
                  </div>
                </td>
                <td>
                  <span className="game-system-badge">
                    {campaign.gameSystem || 'daggerheart'}
                  </span>
                </td>
                <td>
                  <div className="visibility-badge">
                    {campaign.isPublic ? (
                      <>
                        <Globe size={14} />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  <div className="member-count">
                    <Users size={14} />
                    <span>{getMemberCount(campaign)}</span>
                  </div>
                </td>
                <td>
                  <div className="creator-info">
                    <User size={14} />
                    <span>{campaign.members?.[campaign.createdBy]?.displayName || 'Unknown'}</span>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{formatDate(campaign.createdAt)}</span>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(campaign.id);
                        alert(`Campaign ID copied: ${campaign.id}`);
                      }}
                      title="Copy campaign ID"
                    >
                      Copy ID
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleViewCampaign(campaign)}
                    >
                      View Details
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteCampaign(campaign)}
                      title="Delete campaign"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {allCampaigns.length === 0 && (
          <div className="no-campaigns">
            <p>No campaigns found in the system.</p>
          </div>
        )}
      </div>

      {selectedCampaign && (
        <div className="campaign-details-modal">
          <div className="modal-backdrop" onClick={() => setSelectedCampaign(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedCampaign.name}</h2>
              <button
                className="btn btn-icon"
                onClick={() => setSelectedCampaign(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Description:</strong>
                <p>{selectedCampaign.description || 'No description provided'}</p>
              </div>
              <div className="detail-row">
                <strong>Game System:</strong>
                <p>{selectedCampaign.gameSystem || 'daggerheart'}</p>
              </div>
              <div className="detail-row">
                <strong>Visibility:</strong>
                <p>{selectedCampaign.isPublic ? 'Public' : 'Private'}</p>
              </div>
              <div className="detail-row">
                <strong>Created:</strong>
                <p>{formatDate(selectedCampaign.createdAt)}</p>
              </div>
              <div className="detail-row">
                <strong>Last Updated:</strong>
                <p>{formatDate(selectedCampaign.updatedAt)}</p>
              </div>
              <div className="detail-row">
                <strong>Members:</strong>
                <ul className="members-list">
                  {selectedCampaign.members && Object.entries(selectedCampaign.members).map(([uid, member]) => (
                    <li key={uid}>
                      <span className={`role-badge ${member.role}`}>
                        {member.role === 'dm' ? 'DM' : 'Player'}
                      </span>
                      {member.displayName || member.email}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedCampaign.joinRequests && Object.keys(selectedCampaign.joinRequests).length > 0 && (
                <div className="detail-row">
                  <strong>Pending Join Requests:</strong>
                  <ul className="join-requests-list">
                    {Object.entries(selectedCampaign.joinRequests).map(([uid, request]) => (
                      <li key={uid}>
                        {request.displayName || request.email} - {formatDate(request.requestedAt)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
