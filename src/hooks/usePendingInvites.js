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
        console.log('Checking for pending invites for:', userEmail);

        // Query only campaigns where user is in pendingInvites
        const q = query(
          collection(db, 'campaigns'),
          where('pendingInvites', 'array-contains', userEmail)
        );

        const campaignsSnapshot = await getDocs(q);
        console.log('Found', campaignsSnapshot.docs.length, 'campaigns with pending invites');

        for (const campaignDoc of campaignsSnapshot.docs) {
          try {
            const campaignData = campaignDoc.data();

            console.log('Processing invite for campaign:', campaignData.name);

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

            console.log('Successfully joined campaign:', campaignData.name);
          } catch (error) {
            console.error('Error joining campaign:', error);
          }
        }

        if (joined.length > 0) {
          console.log('Joined campaigns:', joined);
          setJoinedCampaigns(joined);
        } else {
          console.log('No campaigns to join');
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
