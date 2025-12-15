import { getGlobalTransactionsAction } from '../actions';
export const dynamic = 'force-dynamic';
import AdminTransactionsClient from './client';

export default async function TransactionsPage() {
    const transactions = await getGlobalTransactionsAction();

    return <AdminTransactionsClient initialTransactions={transactions} />;
}
