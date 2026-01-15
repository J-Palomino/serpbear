import { readFile, writeFile } from 'fs/promises';

interface KeyUsage {
  key: string;
  provider: string;
  usageCount: number;
  lastUsed: string;
  monthlyLimit: number;
  resetDate: string;
}

interface KeyRotationState {
  keys: KeyUsage[];
  currentIndex: number;
}

const KEY_STATE_FILE = `${process.cwd()}/data/key_rotation.json`;

/**
 * Get the current key rotation state from file
 */
export const getKeyRotationState = async (): Promise<KeyRotationState> => {
  try {
    const raw = await readFile(KEY_STATE_FILE, { encoding: 'utf-8' });
    return JSON.parse(raw);
  } catch (error) {
    // Initialize with empty state
    const initialState: KeyRotationState = { keys: [], currentIndex: 0 };
    await saveKeyRotationState(initialState);
    return initialState;
  }
};

/**
 * Save key rotation state to file
 */
export const saveKeyRotationState = async (state: KeyRotationState): Promise<void> => {
  await writeFile(KEY_STATE_FILE, JSON.stringify(state, null, 2), { encoding: 'utf-8' });
};

/**
 * Add a new API key to the rotation pool
 */
export const addApiKey = async (
  key: string,
  provider: string,
  monthlyLimit: number = 5000
): Promise<void> => {
  const state = await getKeyRotationState();

  // Check if key already exists
  const exists = state.keys.find(k => k.key === key);
  if (exists) {
    console.log('[KeyRotation] Key already exists in pool');
    return;
  }

  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  state.keys.push({
    key,
    provider,
    usageCount: 0,
    lastUsed: '',
    monthlyLimit,
    resetDate,
  });

  await saveKeyRotationState(state);
  console.log(`[KeyRotation] Added new ${provider} key to pool. Total keys: ${state.keys.length}`);
};

/**
 * Remove an API key from the rotation pool
 */
export const removeApiKey = async (key: string): Promise<void> => {
  const state = await getKeyRotationState();
  state.keys = state.keys.filter(k => k.key !== key);
  if (state.currentIndex >= state.keys.length) {
    state.currentIndex = 0;
  }
  await saveKeyRotationState(state);
  console.log(`[KeyRotation] Removed key from pool. Total keys: ${state.keys.length}`);
};

/**
 * Get the next available API key using round-robin rotation
 * Skips keys that have exceeded their monthly limit
 */
export const getNextApiKey = async (provider?: string): Promise<string | null> => {
  const state = await getKeyRotationState();

  if (state.keys.length === 0) {
    console.log('[KeyRotation] No API keys in rotation pool');
    return null;
  }

  // Reset usage counts if we're in a new month
  const now = new Date();
  state.keys = state.keys.map(k => {
    const resetDate = new Date(k.resetDate);
    if (now >= resetDate) {
      // Reset for new month
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        ...k,
        usageCount: 0,
        resetDate: nextReset.toISOString(),
      };
    }
    return k;
  });

  // Filter by provider if specified
  const availableKeys = provider
    ? state.keys.filter(k => k.provider === provider)
    : state.keys;

  if (availableKeys.length === 0) {
    console.log(`[KeyRotation] No keys available for provider: ${provider}`);
    return null;
  }

  // Find the next key that hasn't exceeded its limit
  let attempts = 0;
  while (attempts < availableKeys.length) {
    const keyIndex = state.currentIndex % availableKeys.length;
    const keyInfo = availableKeys[keyIndex];

    if (keyInfo.usageCount < keyInfo.monthlyLimit) {
      // Found a valid key, update usage
      keyInfo.usageCount += 1;
      keyInfo.lastUsed = now.toISOString();

      // Update the state
      const stateKeyIndex = state.keys.findIndex(k => k.key === keyInfo.key);
      if (stateKeyIndex !== -1) {
        state.keys[stateKeyIndex] = keyInfo;
      }

      // Move to next key for next request (round-robin)
      state.currentIndex = (keyIndex + 1) % availableKeys.length;
      await saveKeyRotationState(state);

      console.log(`[KeyRotation] Using key ${keyIndex + 1}/${availableKeys.length} (${keyInfo.provider}) - Usage: ${keyInfo.usageCount}/${keyInfo.monthlyLimit}`);
      return keyInfo.key;
    }

    state.currentIndex = (state.currentIndex + 1) % availableKeys.length;
    attempts += 1;
  }

  console.log('[KeyRotation] All keys have exceeded their monthly limits');
  return null;
};

/**
 * Get statistics for all keys in the rotation pool
 */
export const getKeyStats = async (): Promise<KeyUsage[]> => {
  const state = await getKeyRotationState();
  // Return keys with masked values for security
  return state.keys.map(k => ({
    ...k,
    key: `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 4)}`,
  }));
};

/**
 * Get total remaining scrapes across all keys
 */
export const getTotalRemainingScapes = async (): Promise<number> => {
  const state = await getKeyRotationState();
  return state.keys.reduce((total, k) => total + (k.monthlyLimit - k.usageCount), 0);
};

export default {
  getNextApiKey,
  addApiKey,
  removeApiKey,
  getKeyStats,
  getTotalRemainingScapes,
  getKeyRotationState,
};
