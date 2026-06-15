# engine/radar_pass.py

import os
import datetime
import json
import numpy as np
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
from db_client import insert_metric

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
    """
    Processes SAR data to count vessels using a dB thresholding and size filtering.
    """
    epsilon = 1e-12
    sar_data[sar_data <= 0] = epsilon
    sar_db = 10 * np.log10(sar_data)

    # Threshold: Ships are very bright.
    threshold_db = -5 
    binary_mask = sar_db > threshold_db

    # Label connected components
    labeled_array, num_features = label(binary_mask)

    detected_ships = 0
    for i in range(1, num_features + 1):
        pixel_count = np.sum(labeled_array == i)
        # A ship at 10m resolution is typically between 2 and 100 pixels.
        if 2 <= pixel_count <= 100:
            detected_ships += 1

    return detected_ships

def process_target(target):
    """
    Performs a radar pass for a single target (port).
    """
    name = target['name']
    lat = target['lat']
    lon = target['lon']
    bbox_size = target['bbox_size']
    offset_lon = target.get('offset_lon', 0)

    print(f"\n--- Processing: {name} ---")

    # Create bounding box
    bbox = BBox(
        bbox=(
            lon - bbox_size / 2 + offset_lon,
            lat - bbox_size / 2,
            lon + bbox_size / 2 + offset_lon,
            lat + bbox_size / 2,
        ),
        crs=CRS.WGS84,
    )

    # Define time interval (last 30 days)
    end_time = datetime.datetime.now()
    start_time = end_time - datetime.timedelta(days=30)

    # Image size
    resolution = 10  # meters
    image_size = bbox_to_dimensions(bbox, resolution=resolution)

    # Define custom data collection
    s1_cdse_collection = DataCollection.SENTINEL1_IW.define_from(
        "s1_cdse", service_url=config.sh_base_url
    )

    # Create request
    request = SentinelHubRequest(
        evalscript=evalscript_s1,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=s1_cdse_collection,
                time_interval=(start_time, end_time),
            )
        ],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=bbox,
        size=image_size,
        config=config,
    )

    try:
        print(f"Fetching Sentinel-1 SAR data for {name}...")
        sar_image = request.get_data()[0]
        print("Data fetched successfully.")

        vessel_count = count_ships(sar_image)
        print(f"Detected {vessel_count} vessels in {name}.")

        print(f"Inserting metric for {name} into database...")
        insert_metric(location=name, vessel_count=vessel_count)

    except DownloadFailedException as e:
        print(f"Download failed for {name}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred for {name}: {e}")

def perform_radar_pass():
    """
    Executes radar passes for all targets defined in targets.json.
    """
    print("Starting Global Radar Monitoring...")
    
    # Load targets
    targets_path = os.path.join(os.path.dirname(__file__), 'targets.json')
    with open(targets_path, 'r') as f:
        targets = json.load(f)

    for target in targets:
        process_target(target)

    print("\nGlobal Radar Pass completed successfully.")

if __name__ == "__main__":
    perform_radar_pass()
