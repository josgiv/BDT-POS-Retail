'use server';

import { createClient } from "@/utils/supabase/server";
import { localDb, identityDb } from "@/lib/db";
import { redirect } from "next/navigation";

import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
    const username = formData.get("username") as string;
    const pin = formData.get("pin") as string;
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    if (!username || !pin) {
        return { error: "Username and PIN are required" };
    }

    let email = "";

    // 1. Resolve Username -> Email using Direct DB Connection (Bypassing Supabase API Schema Restrictions)
    const client = await identityDb.connect();
    try {
        console.log(`[Login] Attempting login for username: '${username}'`);

        // DEEP DEBUGGING
        const dbNameRes = await client.query("SELECT current_database()");
        console.log(`[Login] Connected to Database: ${dbNameRes.rows[0].current_database}`);

        const allDbsRes = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
        console.log(`[Login] Available Databases:`, allDbsRes.rows.map(r => r.datname));

        const tablesRes = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'retail_identity'
        `);
        console.log(`[Login] Tables in 'retail_identity':`, tablesRes.rows.map(r => r.table_name));

        const countRes = await client.query("SELECT count(*) FROM retail_identity.profiles");
        console.log(`[Login] Row count in retail_identity.profiles: ${countRes.rows[0].count}`);

        // Step 1: Find Profile
        const profileQuery = `
            SELECT id, username 
            FROM retail_identity.profiles 
            WHERE username = $1
        `;
        const profileRes = await client.query(profileQuery, [username]);

        console.log(`[Login] Profile search result:`, profileRes.rows);

        if (profileRes.rows.length === 0) {
            console.error(`[Login] Username '${username}' not found in retail_identity.profiles`);
            // Check if there are ANY profiles
            const allProfiles = await client.query("SELECT username FROM retail_identity.profiles LIMIT 5");
            console.log(`[Login] Sample profiles in DB:`, allProfiles.rows);

            return { error: "Username not found" };
        }

        const userId = profileRes.rows[0].id;
        console.log(`[Login] Found User ID: ${userId}`);

        // Step 2: Find Email from Users
        const userQuery = `
            SELECT email 
            FROM retail_identity.users 
            WHERE id = $1
        `;
        const userRes = await client.query(userQuery, [userId]);

        if (userRes.rows.length === 0) {
            console.error(`[Login] User ID '${userId}' found in profiles but not in users table.`);
            return { error: "User account corrupted (Email missing)" };
        }

        email = userRes.rows[0].email;
        console.log(`[Login] Resolved Email: ${email}`);

    } catch (err) {
        console.error("Identity DB Error:", err);
        return { error: "System error: Unable to verify identity" };
    } finally {
        client.release();
    }

    // 2. Sign in with Supabase Auth (using PIN as password)
    console.log(`[Login] Authenticating with Supabase Auth for ${email}...`);
    const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pin,
    });

    if (authError) {
        console.error("Auth error:", authError);
        console.error(`[Login] FAILED. Please check Supabase Dashboard -> Authentication.`);
        console.error(`[Login] Ensure user '${email}' exists and password is '${pin}'.`);
        return { error: "Invalid PIN or Login Failed (Check Supabase Auth)" };
    }

    return { success: true };
}
