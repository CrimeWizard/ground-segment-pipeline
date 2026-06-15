// src/app/api/thresholds/route.ts

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT location, max_capacity FROM alert_thresholds');
    client.release();
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Thresholds query failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
