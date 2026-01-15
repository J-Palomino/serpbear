import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../utils/verifyUser';
import {
  addApiKey,
  removeApiKey,
  getKeyStats,
  getTotalRemainingScapes,
  getKeyRotationState,
} from '../../utils/keyRotation';

type KeysResponse = {
  keys?: any[];
  totalRemaining?: number;
  error?: string;
  success?: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<KeysResponse>) {
  const authorized = verifyUser(req, res);
  if (authorized !== 'authorized') {
    return res.status(401).json({ error: authorized });
  }

  if (req.method === 'GET') {
    return getKeys(req, res);
  }
  if (req.method === 'POST') {
    return addKey(req, res);
  }
  if (req.method === 'DELETE') {
    return deleteKey(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const getKeys = async (req: NextApiRequest, res: NextApiResponse<KeysResponse>) => {
  try {
    const keys = await getKeyStats();
    const totalRemaining = await getTotalRemainingScapes();
    return res.status(200).json({ keys, totalRemaining });
  } catch (error) {
    console.log('[ERROR] Getting API keys:', error);
    return res.status(500).json({ error: 'Error getting API keys' });
  }
};

const addKey = async (req: NextApiRequest, res: NextApiResponse<KeysResponse>) => {
  const { key, provider, monthlyLimit } = req.body || {};

  if (!key || !provider) {
    return res.status(400).json({ error: 'Key and provider are required' });
  }

  try {
    await addApiKey(key, provider, monthlyLimit || 5000);
    const keys = await getKeyStats();
    const totalRemaining = await getTotalRemainingScapes();
    return res.status(200).json({ success: true, keys, totalRemaining });
  } catch (error) {
    console.log('[ERROR] Adding API key:', error);
    return res.status(500).json({ error: 'Error adding API key' });
  }
};

const deleteKey = async (req: NextApiRequest, res: NextApiResponse<KeysResponse>) => {
  const { key } = req.body || {};

  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }

  try {
    // Get the full key from state before deleting (since the passed key might be masked)
    const state = await getKeyRotationState();
    const fullKey = state.keys.find(k =>
      k.key.startsWith(key.substring(0, 8)) && k.key.endsWith(key.substring(key.length - 4))
    );

    if (fullKey) {
      await removeApiKey(fullKey.key);
    }

    const keys = await getKeyStats();
    const totalRemaining = await getTotalRemainingScapes();
    return res.status(200).json({ success: true, keys, totalRemaining });
  } catch (error) {
    console.log('[ERROR] Deleting API key:', error);
    return res.status(500).json({ error: 'Error deleting API key' });
  }
};
