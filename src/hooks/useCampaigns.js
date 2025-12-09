import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useCampaigns() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to campaigns where user is a member
  useEffect(() => {
    if (!currentUser) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    // Query campaigns where current user is in the members map
    const q = query(
      collection(db, 'campaigns'),
      where(`members.${currentUser.uid}.role`, 'in', ['dm', 'player'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCampaigns(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading campaigns:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Create new campaign
  const createCampaign = async (name, description = '', isPublic = false) => {
    if (!currentUser) return null;

    const docRef = await addDoc(
      collection(db, 'campaigns'),
      {
        name,
        description,
        createdBy: currentUser.uid,
        dmId: currentUser.uid, // Creator is always the DM
        isPublic: isPublic,
        joinRequests: {}, // Store pending join requests
        members: {
          [currentUser.uid]: {
            role: 'dm',
            email: currentUser.email,
            displayName: currentUser.displayName || 'DM',
            joinedAt: serverTimestamp()
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );

    return docRef.id;
  };

  // Update campaign
  const updateCampaign = async (campaignId, updates) => {
    if (!currentUser) return;

    await updateDoc(
      doc(db, 'campaigns', campaignId),
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    );
  };

  // Delete campaign
  const deleteCampaign = async (campaignId) => {
    if (!currentUser) return;

    await deleteDoc(
      doc(db, 'campaigns', campaignId)
    );
  };

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign
  };
}
