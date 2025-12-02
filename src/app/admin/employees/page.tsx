import { EmployeesClient } from './client';
import { localDb } from '@/lib/db';

async function getEmployees() {
    const client = await localDb.connect();
    try {
        const res = await client.query(`
      SELECT * FROM users_local ORDER BY full_name ASC
    `);
        return res.rows;
    } finally {
        client.release();
    }
}

export default async function EmployeesPage() {
    const employees = await getEmployees();
    return <EmployeesClient initialEmployees={employees} />;
}
