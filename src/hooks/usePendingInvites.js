import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, writeBatch, arrayRemove, serverTimestamp } from 'firebase/firestore';
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

      try {
        // Query only campaigns where user is in pendingInvites
        const q = query(
          collection(db, 'campaigns'),
          where('pendingInvites', 'array-contains', userEmail)
        );

        const campaignsSnapshot = await getDocs(q);
        if (campaignsSnapshot.empty) return;

        const batch = writeBatch(db);
        const joined = [];

        for (const campaignDoc of campaignsSnapshot.docs) {
          const campaignData = campaignDoc.data();
          const members = campaignData.members || {};
          members[currentUser.uid] = {
            role: 'player',
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email,
            joinedAt: serverTimestamp()
          };

          batch.update(doc(db, 'campaigns', campaignDoc.id), {
            members,
            pendingInvites: arrayRemove(userEmail),
            updatedAt: serverTimestamp()
          });

          joined.push({
            id: campaignDoc.id,
            name: campaignData.name
          });
        }

        await batch.commit();
        setJoinedCampaigns(joined);
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
