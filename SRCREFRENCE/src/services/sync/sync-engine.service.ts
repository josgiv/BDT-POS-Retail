import { getUnsyncedTransactionsAction, syncTransactionToCloudAction, markTransactionSyncedAction } from '@/app/sync/actions';
import { toast } from 'sonner';

export const SyncEngine = {
    start: () => {
        if (typeof window === 'undefined') return;

        // Run every 30 seconds
        setInterval(async () => {
            if (!navigator.onLine) return;

            try {
                const pendingTransactions = await getUnsyncedTransactionsAction();

                if (pendingTransactions.length === 0) return;

                console.log(`[SyncEngine] Found ${pendingTransactions.length} pending transactions.`);

                let syncedCount = 0;

                // Process batch
                for (const transaction of pendingTransactions) {
                    const success = await syncTransactionToCloudAction(transaction);
                    if (success) {
                        await markTransactionSyncedAction(transaction.transaction_uuid);
                        syncedCount++;
                        console.log(`[SyncEngine] Synced transaction ${transaction.transaction_uuid}`);
                    }
                }

                if (syncedCount > 0) {
                    toast.success(`${syncedCount} Data Transaksi berhasil disinkronisasi ke Cloud.`);
                }

            } catch (error) {
                console.error('[SyncEngine] Sync failed:', error);
            }
        }, 30000);
    }
};
