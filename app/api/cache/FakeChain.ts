// Simple JSON-file “blockchain” cache ---------------------------------------
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type FakeTx = {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
};

export type Chain = {
  balances: Record<string, number>;
  txs: FakeTx[];
};

/* Use ./tmp so it works on Vercel, Netlify & local ---------------------------------- */
const file = path.resolve(process.cwd(), 'tmp', 'fakechain.json');

/* ---------------------------- helpers ------------------------------------ */
export async function loadChain(): Promise<Chain> {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data) as Chain;
  } catch (e) {
    console.error('loadChain failed', e);
    return { balances: {}, txs: [] };
  }
}

export async function saveChain(chain: Chain): Promise<void> {
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(chain, null, 2), 'utf-8');
  } catch (e) {
    console.error('saveChain failed', e);
  }
}

export function createTx(from: string, to: string, amount: number): FakeTx {
  return {
    id: crypto.randomUUID(),
    from,
    to,
    amount,
    timestamp: Date.now()
  };
}


