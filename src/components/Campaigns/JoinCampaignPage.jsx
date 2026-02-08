import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserPlus, Clock, CheckCircle, XCircle, ArrowRight, Swords } from 'lucide-react';
import './JoinCampaignPage.css';

export default function JoinCampaignPage({ campaignId, onJoinSuccess }) {
    const { currentUser } = useAuth();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requesting, setRequesting] = useState(false);
    const [joinStatus, setJoinStatus] = useState(null); // 'member', 'pending', 'denied', or null

    useEffect(() => {
        const fetchCampaign = async () => {
            if (!campaignId) {
                setError('No campaign ID provided');
                setLoading(false);
                return;
            }

            try {
                const campaignRef = doc(db, 'campaigns', campaignId);
                const campaignSnap = await getDoc(campaignRef);

                if (!campaignSnap.exists()) {
                    setError('Campaign not found');
                    setLoading(false);
                    return;
                }

                const campaignData = { id: campaignSnap.id, ...campaignSnap.data() };
                setCampaign(campaignData);

                // Check user's status with this campaign
                if (currentUser) {
                    if (campaignData.members?.[currentUser.uid]) {
                        setJoinStatus('member');
                    } else if (campaignData.joinRequests?.[currentUser.uid]) {
                        setJoinStatus(campaignData.joinRequests[currentUser.uid].status);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching campaign:', err);
                setError('Failed to load campaign');
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [campaignId, currentUser]);

    const handleRequestJoin = async () => {
        if (!currentUser || !campaign) return;

        setRequesting(true);

        try {
            const campaignRef = doc(db, 'campaigns', campaign.id);

            await updateDoc(campaignRef, {
                [`joinRequests.${currentUser.uid}`]: {
                    email: currentUser.email,
                    displayName: currentUser.displayName || 'Player',
                    requestedAt: serverTimestamp(),
                    status: 'pending'
                },
                updatedAt: serverTimestamp()
            });

            setJoinStatus('pending');
        } catch (err) {
            console.error('Error sending join request:', err);
            alert('Failed to send join request. Please try again.');
        } finally {
            setRequesting(false);
        }
    };

    const handleEnterCampaign = () => {
        if (onJoinSuccess) {
            onJoinSuccess(campaignId);
        }
    };

    const getMemberCount = () => {
        return Object.keys(campaign?.members || {}).length;
    };

    const getDMName = () => {
        const dmId = campaign?.dmId;
        return campaign?.members?.[dmId]?.displayName || 'Unknown DM';
    };

    if (loading) {
        return (
            <div className="join-campaign-page">
                <div className="join-campaign-card">
                    <div className="loading-spinner"></div>
                    <p>Loading campaign...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="join-campaign-page">
                <div className="join-campaign-card error">
                    <XCircle size={48} />
                    <h2>Oops!</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => window.location.href = window.location.origin}>
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="join-campaign-page">
            <div className="join-campaign-card">
                <div className="campaign-icon">
                    <Swords size={48} />
                </div>

                <h1>{campaign.name}</h1>

                {campaign.description && (
                    <p className="campaign-description">{campaign.description}</p>
                )}

                <div className="campaign-meta">
                    <div className="meta-item">
                        <Users size={18} />
                        <span>{getMemberCount()} {getMemberCount() === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="meta-item">
                        <span className="dm-label">DM:</span>
                        <span>{getDMName()}</span>
                    </div>
                </div>

                {/* Already a member */}
                {joinStatus === 'member' && (
                    <div className="join-status member">
                        <CheckCircle size={24} />
                        <div>
                            <strong>You're already a member!</strong>
                            <p>Jump into the campaign and start playing.</p>
                        </div>
                    </div>
                )}

                {/* Pending request */}
                {joinStatus === 'pending' && (
                    <div className="join-status pending">
                        <Clock size={24} />
                        <div>
                            <strong>Request Pending</strong>
                            <p>The DM will review your join request soon.</p>
                        </div>
                    </div>
                )}

                {/* Denied request */}
                {joinStatus === 'denied' && (
                    <div className="join-status denied">
                        <XCircle size={24} />
                        <div>
                            <strong>Request Declined</strong>
                            <p>Your previous request was declined. You may request again if circumstances change.</p>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="join-actions">
                    {joinStatus === 'member' && (
                        <button className="btn btn-primary btn-lg" onClick={handleEnterCampaign}>
                            <ArrowRight size={20} />
                            Enter Campaign
                        </button>
                    )}

                    {(joinStatus === null || joinStatus === 'denied') && (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleRequestJoin}
                            disabled={requesting}
                        >
                            <UserPlus size={20} />
                            {requesting ? 'Sending Request...' : 'Request to Join'}
                        </button>
                    )}
                </div>

                {!campaign.isPublic && joinStatus !== 'member' && (
                    <p className="private-notice">
                        This is a private campaign. You'll need the DM's approval to join.
                    </p>
                )}
            </div>
        </div>
    );
}
