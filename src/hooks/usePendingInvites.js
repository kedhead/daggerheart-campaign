import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export function usePendingInvites() {
  const { currentUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [joinedCampaigns, setJoinedCampaigns] = useState([]);

  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    const checkPendingInvites = async () => {
      setChecking(true);
      const userEmail = currentUser.email.toLowerCase();
      const joined = [];

      try {
        // Query all campaigns that have this email in pending invites
        const q = query(
          collection(db, 'campaigns'),
          where('pendingInvites', 'array-contains', userEmail)
        );

        const campaignsSnapshot = await getDocs(q);

        for (const campaignDoc of campaignsSnapshot.docs) {
          try {
            const campaignData = campaignDoc.data();

            // Add user to campaign members
            const members = campaignData.members || {};
            members[currentUser.uid] = {
              role: 'player',
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email,
              joinedAt: serverTimestamp()
            };

            // Update campaign: add member and remove from pending invites
            await updateDoc(doc(db, 'campaigns', campaignDoc.id), {
              members,
              pendingInvites: arrayRemove(userEmail),
              updatedAt: serverTimestamp()
            });

            joined.push({
              id: campaignDoc.id,
              name: campaignData.name
            });
          } catch (error) {
            console.error('Error joining campaign:', error);
          }
        }

        if (joined.length > 0) {
          setJoinedCampaigns(joined);
        }
      } catch (error) {
        console.error('Error checking pending invites:', error);
      } finally {
        setChecking(false);
      }
    };

    checkPendingInvites();
  }, [currentUser]);

  return { checking, joinedCampaigns };
}
