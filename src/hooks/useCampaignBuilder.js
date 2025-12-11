import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing Campaign Wizard state
 * Handles step navigation, data persistence, and auto-save
 */
export function useCampaignBuilder(campaignId, campaignFrameDraft, saveCampaignFrameDraft, completeCampaignFrame) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [data, setData] = useState({
    pitch: '',
    toneAndFeel: [],
    themes: [],
    touchstones: [],
    overview: '',
    communities: {},
    ancestries: {},
    classes: {},
    playerPrinciples: [],
    gmPrinciples: [],
    distinctions: [],
    incitingIncident: '',
    campaignMechanics: [],
    sessionZeroQuestions: []
  });
  const [templateUsed, setTemplateUsed] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  // Auto-save timer
  const saveTimerRef = useRef(null);

  // Load from draft on mount
  useEffect(() => {
    if (campaignFrameDraft) {
      setData({
        pitch: campaignFrameDraft.pitch || '',
        toneAndFeel: campaignFrameDraft.toneAndFeel || [],
        themes: campaignFrameDraft.themes || [],
        touchstones: campaignFrameDraft.touchstones || [],
        overview: campaignFrameDraft.overview || '',
        communities: campaignFrameDraft.communities || {},
        ancestries: campaignFrameDraft.ancestries || {},
        classes: campaignFrameDraft.classes || {},
        playerPrinciples: campaignFrameDraft.playerPrinciples || [],
        gmPrinciples: campaignFrameDraft.gmPrinciples || [],
        distinctions: campaignFrameDraft.distinctions || [],
        incitingIncident: campaignFrameDraft.incitingIncident || '',
        campaignMechanics: campaignFrameDraft.campaignMechanics || [],
        sessionZeroQuestions: campaignFrameDraft.sessionZeroQuestions || []
      });
      setCurrentStep(campaignFrameDraft.currentStep || 0);
      setCompletedSteps(campaignFrameDraft.completedSteps || []);
      setTemplateUsed(campaignFrameDraft.templateUsed || null);
    }
  }, [campaignFrameDraft]);

  // Load from localStorage on mount
  useEffect(() => {
    const localKey = `dh_wizard_state_${campaignId}`;
    const savedState = localStorage.getItem(localKey);

    if (savedState && !campaignFrameDraft) {
      try {
        const parsed = JSON.parse(savedState);
        setCurrentStep(parsed.currentStep || 0);
        setCompletedSteps(parsed.completedSteps || []);
      } catch (err) {
        console.error('Failed to load wizard state from localStorage:', err);
      }
    }
  }, [campaignId, campaignFrameDraft]);

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const localKey = `dh_wizard_state_${campaignId}`;
      localStorage.setItem(localKey, JSON.stringify({
        currentStep,
        completedSteps,
        lastSaved: Date.now()
      }));
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [currentStep, completedSteps, campaignId]);

  // Update data for current section
  const updateData = useCallback((section, value) => {
    setData(prev => ({
      ...prev,
      [section]: value
    }));
  }, []);

  // Load template
  const loadTemplate = useCallback((template) => {
    setData({
      pitch: template.pitch || '',
      toneAndFeel: template.toneAndFeel || [],
      themes: template.themes || [],
      touchstones: template.touchstones || [],
      overview: template.overview || '',
      communities: template.communities || {},
      ancestries: template.ancestries || {},
      classes: template.classes || {},
      playerPrinciples: template.playerPrinciples || [],
      gmPrinciples: template.gmPrinciples || [],
      distinctions: template.distinctions || [],
      incitingIncident: template.incitingIncident || '',
      campaignMechanics: template.campaignMechanics || [],
      sessionZeroQuestions: template.sessionZeroQuestions || []
    });
    setTemplateUsed(template.id);
  }, []);

  // Navigate to step
  const goToStep = useCallback((stepIndex) => {
    setCurrentStep(stepIndex);
  }, []);

  // Go to next step
  const nextStep = useCallback(async () => {
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    // Save draft to Firestore
    if (saveCampaignFrameDraft) {
      const draftData = {
        ...data,
        currentStep: currentStep + 1,
        completedSteps: [...completedSteps, currentStep],
        templateUsed: templateUsed || null,
        status: 'draft'
      };

      // Filter out any undefined values
      Object.keys(draftData).forEach(key => {
        if (draftData[key] === undefined) {
          delete draftData[key];
        }
      });

      await saveCampaignFrameDraft(draftData);
    }

    // Move to next step
    if (currentStep < 14) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, completedSteps, data, templateUsed, saveCampaignFrameDraft]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Save draft manually
  const saveDraft = useCallback(async () => {
    if (saveCampaignFrameDraft) {
      const draftData = {
        ...data,
        currentStep,
        completedSteps,
        templateUsed: templateUsed || null,
        status: 'draft'
      };

      // Filter out any undefined values
      Object.keys(draftData).forEach(key => {
        if (draftData[key] === undefined) {
          delete draftData[key];
        }
      });

      await saveCampaignFrameDraft(draftData);
    }
  }, [data, currentStep, completedSteps, templateUsed, saveCampaignFrameDraft]);

  // Complete wizard
  const complete = useCallback(async () => {
    if (completeCampaignFrame) {
      // Prepare data for saving, filtering out undefined values
      const frameData = {
        ...data,
        templateUsed: templateUsed || null
      };

      // Only add complexity if it has a valid value
      if (data.complexity !== undefined && data.complexity !== null) {
        frameData.complexity = data.complexity;
      }

      // Filter out any undefined values
      Object.keys(frameData).forEach(key => {
        if (frameData[key] === undefined) {
          delete frameData[key];
        }
      });

      await completeCampaignFrame(frameData);

      // Clear localStorage
      const localKey = `dh_wizard_state_${campaignId}`;
      localStorage.removeItem(localKey);

      setIsComplete(true);
    }
  }, [data, templateUsed, campaignId, completeCampaignFrame]);

  // Check if current step is valid
  const canProceed = useCallback(() => {
    const stepData = getStepData(currentStep, data);

    // Different validation for each step
    switch (currentStep) {
      case 0: // Pitch
        return stepData && stepData.length > 10;
      case 1: // Tone & Feel
        return Array.isArray(stepData) && stepData.length > 0;
      case 2: // Themes
        return Array.isArray(stepData) && stepData.length > 0;
      case 3: // Touchstones
        return Array.isArray(stepData) && stepData.length > 0;
      case 4: // Overview
        return stepData && stepData.length > 20;
      case 11: // Inciting Incident
        return stepData && stepData.length > 10;
      default:
        return true; // Other steps are optional
    }
  }, [currentStep, data]);

  return {
    // State
    currentStep,
    completedSteps,
    data,
    templateUsed,
    isComplete,

    // Methods
    updateData,
    loadTemplate,
    goToStep,
    nextStep,
    previousStep,
    saveDraft,
    complete,
    canProceed
  };
}

// Helper to get data for specific step
function getStepData(stepIndex, data) {
  const stepKeys = [
    'pitch',
    'toneAndFeel',
    'themes',
    'touchstones',
    'overview',
    'communities',
    'ancestries',
    'classes',
    'playerPrinciples',
    'gmPrinciples',
    'distinctions',
    'incitingIncident',
    'campaignMechanics',
    'sessionZeroQuestions'
  ];

  return data[stepKeys[stepIndex]];
}
