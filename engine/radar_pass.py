# engine/radar_pass.py

import os
import datetime
import json
import numpy as np
import psycopg2
from scipy.ndimage import label
import sentinelhub
from sentinelhub import (
    SHConfig,
    SentinelHubRequest,
    DataCollection,
    MimeType,
    CRS,
    BBox,
    bbox_to_dimensions,
)
from sentinelhub.exceptions import DownloadFailedException
from dotenv import load_dotenv

# Import the database client
from db_client import insert_metric, get_db_connection
from alert_service import send_alert_email

# --- Configuration ---

load_dotenv()

config = SHConfig()
config.sh_base_url = "https://sh.dataspace.copernicus.eu"
config.sh_token_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
config.sh_client_id = os.getenv("SH_CLIENT_ID")
config.sh_client_secret = os.getenv("SH_CLIENT_SECRET")

# --- Evalscript for Sentinel-1 ---
evalscript_s1 = """
//VERSION=3
function setup() {
    return {
        input: ["VV"],
        output: { bands: 1, sampleType: "FLOAT32" }
    };
}

function evaluatePixel(sample) {
    return [sample.VV];
}
"""

# --- Data Processing ---

def count_ships(sar_data: np.ndarray) -> int:
    epsilon = 1e-12
    sar_data[sar_data <= 0] = epsilon
    sar_db = 10 * np.log10(sar_data)
    threshold_db = -5 
    binary_mask = sar_db > threshold_db
    labeled_array, num_features = label(binary_mask)

    detected_ships = 0
    for i in range(1, num_features + 1):
        pixel_count = np.sum(labeled_array == i)
        if 2 <= pixel_count <= 100:
            detected_ships += 1
    return detected_ships

def check_for_alerts(location, current_count):
    """
    Compares current vessel count against database thresholds and historical data.
    """
    print(f"Checking alert conditions for {location}...")
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # 1. Fetch thresholds
            cur.execute("SELECT max_capacity, velocity_threshold_percent, notification_email FROM alert_thresholds WHERE location = %s", (location,))
            threshold_data = cur.fetchone()
            
            if not threshold_data:
                return
            
            max_cap, vel_threshold, email = threshold_data

            # 2. Fetch previous pass for velocity calculation
            cur.execute("SELECT vessel_count FROM port_metrics WHERE location = %s ORDER BY timestamp DESC LIMIT 1 OFFSET 1", (location,))
            prev_data = cur.fetchone()
            prev_count = prev_data[0] if prev_data else None

            # 3. Logic: Hard Ceiling
            if current_count > max_cap:
                print(f"🚨 ALERT: {location} capacity breached! ({current_count} > {max_cap})")
                trigger_dispatch(location, "CAPACITY_BREACH", current_count, max_cap, email)

            # 4. Logic: Velocity Spike
            if prev_count and prev_count > 0:
                increase_pct = ((current_count - prev_count) / prev_count) * 100
                if increase_pct > vel_threshold:
                    print(f"🚨 ALERT: {location} velocity spike detected! (+{increase_pct:.1f}%)")
                    trigger_dispatch(location, "VELOCITY_SPIKE", current_count, increase_pct, email)

    except Exception as e:
        print(f"Error in alert logic: {e}")
    finally:
        if conn:
            conn.close()

def trigger_dispatch(location, alert_type, current_value, threshold_value, email):
    """
    Dispatches the alert via the alert_service.
    """
    print(f"📡 Dispatching alert to {email}...")
    send_alert_email(location, alert_type, current_value, threshold_value, email)

def process_target(target):
    name = target['name']
    lat = target['lat']
    lon = target['lon']
    bbox_size = target['bbox_size']
    offset_lon = target.get('offset_lon', 0)

    print(f"\n--- Processing: {name} ---")
    bbox = BBox(
        bbox=(lon - bbox_size / 2 + offset_lon, lat - bbox_size / 2, lon + bbox_size / 2 + offset_lon, lat + bbox_size / 2),
        crs=CRS.WGS84,
    )

    end_time = datetime.datetime.now()
    start_time = end_time - datetime.timedelta(days=30)
    image_size = bbox_to_dimensions(bbox, resolution=10)
    s1_cdse_collection = DataCollection.SENTINEL1_IW.define_from("s1_cdse", service_url=config.sh_base_url)

    request = SentinelHubRequest(
        evalscript=evalscript_s1,
        input_data=[SentinelHubRequest.input_data(data_collection=s1_cdse_collection, time_interval=(start_time, end_time))],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=bbox,
        size=image_size,
        config=config,
    )

    try:
        print(f"Fetching Sentinel-1 SAR data for {name}...")
        sar_image = request.get_data()[0]
        vessel_count = count_ships(sar_image)
        insert_metric(location=name, vessel_count=vessel_count)
        
        # New: Trigger alert check
        check_for_alerts(name, vessel_count)

    except Exception as e:
        print(f"An unexpected error occurred for {name}: {e}")

def perform_radar_pass():
    print("Starting Global Radar Monitoring with Alert Detection...")
    targets_path = os.path.join(os.path.dirname(__file__), 'targets.json')
    with open(targets_path, 'r') as f:
        targets = json.load(f)
    for target in targets:
        process_target(target)
    print("\nGlobal Radar Pass completed successfully.")

if __name__ == "__main__":
    perform_radar_pass()
