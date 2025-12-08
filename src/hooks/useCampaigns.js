import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useCampaigns() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's campaigns
  useEffect(() => {
    if (!currentUser) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, `users/${currentUser.uid}/campaigns`),
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
  const createCampaign = async (name, description = '') => {
    if (!currentUser) return null;

    const docRef = await addDoc(
      collection(db, `users/${currentUser.uid}/campaigns`),
      {
        name,
        description,
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
      doc(db, `users/${currentUser.uid}/campaigns`, campaignId),
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
      doc(db, `users/${currentUser.uid}/campaigns`, campaignId)
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
