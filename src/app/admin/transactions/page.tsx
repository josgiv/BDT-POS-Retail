import { getGlobalTransactionsAction } from '../actions';
import AdminTransactionsClient from './client';

export default async function TransactionsPage() {
    const transactions = await getGlobalTransactionsAction();

    return <AdminTransactionsClient initialTransactions={transactions} />;
}
