# engine/db_client.py

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_db_connection():
    """Establishes and returns a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URI"))
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error: Could not connect to the database. {e}")
        # In a real application, you'd want to handle this more gracefully
        # (e.g., logging, retries, etc.)
        raise

def insert_metric(location: str, vessel_count: int):
    """
    Inserts a new metric into the port_metrics table.

    Args:
        location (str): The name of the monitored location (e.g., 'Ain Sokhna').
        vessel_count (int): The number of vessels detected.
    """
    sql = """
        INSERT INTO port_metrics (location, vessel_count)
        VALUES (%s, %s) RETURNING id;
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(sql, (location, vessel_count))
            inserted_id = cur.fetchone()[0]
            conn.commit()
            print(f"Successfully inserted metric for {location}. New record ID: {inserted_id}")
            return inserted_id
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error inserting metric: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    # Example usage for testing the connection and insertion
    # Make sure your .env file has a DATABASE_URI
    print("Testing database client...")
    if not os.getenv("DATABASE_URI"):
        print("DATABASE_URI not found in .env file. Please add it.")
        print("Example: DATABASE_URI=postgresql://user:password@host:port/dbname")
    else:
        try:
            # A simple test to check connectivity
            conn = get_db_connection()
            print("Database connection successful.")
            conn.close()
            # Test insertion
            print("\nTesting metric insertion...")
            # This is a test, so we insert a dummy value
            insert_metric("Test Port", 0)
        except Exception as e:
            print(f"A test failed: {e}")

