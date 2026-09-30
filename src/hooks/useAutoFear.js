// DM-side Fear automation: when a player's action roll comes up with Fear,
// add a Fear to the GM's pool.
//
// Runs on the DM's device because only the DM may write the pool. It listens
// through the same useLiveRoll the dice tray uses, which emits each roll once
// PER DEVICE — so a DM with a laptop and a tablet open sees every roll twice.
// applyFearFromRoll records each counted roll in the shared document inside a
// transaction, so the second device finds it already counted and does nothing.
//
// Known limitation, by design: Fear only applies while a DM device has the
// campaign open. During a session that is always true.

import { useCallback } from 'react';
import { useLiveRoll } from '../dice/useLiveRoll';
import { applyFearFromRoll } from '../services/fearPool';
import { dualityEffects, isAutoHopeFearOn } from '../utils/dualityAutomation';

export function useAutoFear({ campaignId, campaign, isDM }) {
  const active = !!campaignId && !!isDM && isAutoHopeFearOn(campaign);

  // Passing no campaign id makes useLiveRoll subscribe to nothing, so a
  // player's device — or a DM who switched automation off — holds no listener.
  useLiveRoll(active ? campaignId : null, useCallback((roll) => {
    if (dualityEffects(roll).fear <= 0) return;
    applyFearFromRoll(campaignId, roll.id).catch((err) => {
      console.error('[useAutoFear] could not apply Fear for roll', roll.id, err);
    });
  }, [campaignId]));
}
