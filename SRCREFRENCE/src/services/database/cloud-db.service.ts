import { Transaction } from '@/types';

export const CloudDBService = {
    syncTransaction: async (transaction: Transaction): Promise<boolean> => {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Randomly fail to simulate network issues (optional, but good for testing)
        // if (Math.random() < 0.1) throw new Error("Network Error");

        console.log('[TiDB] Transaction Synced:', transaction.transaction_uuid);
        return true;
    },

    fetchGlobalStats: async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
            totalSales: 150000000,
            totalTransactions: 4500,
            activeBranches: 2
        };
    }
};
