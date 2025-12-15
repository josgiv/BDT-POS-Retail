import { Product, Transaction } from '@/types';
import { getProductsAction, getProductByBarcodeAction, saveTransactionAction, addProductAction, logDefectiveAction } from '@/app/pos/actions';

export const LocalDBService = {
    initialize: () => {
        // Initialization handled by server/DB setup
    },

    getProducts: async (): Promise<Product[]> => {
        return await getProductsAction();
    },

    getProductByBarcode: async (barcode: string): Promise<Product | undefined> => {
        return await getProductByBarcodeAction(barcode);
    },

    saveTransaction: async (transaction: Transaction): Promise<void> => {
        await saveTransactionAction(transaction);
    },

    addProduct: async (product: Product): Promise<boolean> => {
        return await addProductAction(product);
    },

    logDefective: async (barcode: string, qty: number, reason: string): Promise<boolean> => {
        return await logDefectiveAction(barcode, qty, reason);
    },

    getUploadQueue: async () => {
        // Queue is now managed via database 'synced' flag
        return [];
    }
};
