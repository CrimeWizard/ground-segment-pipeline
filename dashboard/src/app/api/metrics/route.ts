// src/app/api/metrics/route.ts

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
});

export async function GET() {
  console.log('API route /api/metrics hit');
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT id, timestamp, location, vessel_count FROM port_metrics ORDER BY timestamp DESC LIMIT 100'
    );
    client.release();
    
    console.log(`Retrieved ${result.rows.length} metrics from the database.`);
    
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
