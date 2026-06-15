# engine/radar_pass.py

import os
import datetime
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

# Load environment variables from .env file
load_dotenv()

# Sentinel Hub configuration
config = SHConfig()
config.sh_base_url = "https://sh.dataspace.copernicus.eu"
config.sh_token_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
config.sh_client_id = os.getenv("SH_CLIENT_ID")
config.sh_client_secret = os.getenv("SH_CLIENT_SECRET")


# --- Area of Interest (AOI) ---

# Coordinates for Ain Sokhna Port, Egypt
# Center point: 29.648028, 32.356364
# We'll use a smaller bounding box to focus on the harbor and immediate water.
PORT_LAT = 29.648028
PORT_LON = 32.356364
BBOX_SIZE = 0.03  # Smaller size (~3.3km) to reduce land interference

# Create a bounding box
ain_sokhna_bbox = BBox(
    bbox=(
        PORT_LON - BBOX_SIZE / 2 + 0.01, # Shift slightly East to be more in the water
        PORT_LAT - BBOX_SIZE / 2,
        PORT_LON + BBOX_SIZE / 2 + 0.01,
        PORT_LAT + BBOX_SIZE / 2,
    ),
    crs=CRS.WGS84,
)

# --- Evalscript for Sentinel-1 ---
# This script returns the VV polarization.
# Ships typically have high backscatter and appear as bright spots.
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
    print("Analyzing SAR data to count ships...")

    # Small epsilon to avoid log10(0)
    epsilon = 1e-12
    sar_data[sar_data <= 0] = epsilon
    sar_db = 10 * np.log10(sar_data)

    # Threshold: Ships are very bright.
    threshold_db = -5 
    binary_mask = sar_db > threshold_db

    # Label connected components
    labeled_array, num_features = label(binary_mask)

    # Size filtering: Ships are not single pixels, nor are they giant land masses.
    # We count the number of pixels in each labeled object.
    detected_ships = 0
    for i in range(1, num_features + 1):
        pixel_count = np.sum(labeled_array == i)
        # A ship at 10m resolution is typically between 2 and 100 pixels.
        if 2 <= pixel_count <= 100:
            detected_ships += 1

    print(f"Analysis complete. Detected {detected_ships} potential vessels.")
    return detected_ships

# --- Main Execution ---

def perform_radar_pass():
    """
    Executes a full radar pass: fetching data, analyzing it, and storing the result.
    """
    print("Starting radar pass for Ain Sokhna port...")

    # Define a time interval for the last 30 days
    end_time = datetime.datetime.now()
    start_time = end_time - datetime.timedelta(days=30)

    # Get the size of the image
    resolution = 10  # meters
    image_size = bbox_to_dimensions(ain_sokhna_bbox, resolution=resolution)

    # Define a custom data collection based on the correct service URL
    s1_cdse_collection = DataCollection.SENTINEL1_IW.define_from(
        "s1_cdse", service_url=config.sh_base_url
    )

    # Create the request to Sentinel Hub
    request = SentinelHubRequest(
        evalscript=evalscript_s1,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=s1_cdse_collection,
                time_interval=(start_time, end_time),
            )
        ],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=ain_sokhna_bbox,
        size=image_size,
        config=config,
    )

    try:
        # Fetch data from Sentinel Hub
        print("Fetching Sentinel-1 SAR data for the last 30 days...")
        sar_image = request.get_data()[0]
        print("Data fetched successfully.")

        # Process the data to count ships
        vessel_count = count_ships(sar_image)

        # Insert the result into the database
        print("Inserting metric into the database...")
        location_name = "Ain Sokhna"
        insert_metric(location=location_name, vessel_count=vessel_count)

        print("Radar pass completed successfully.")

    except DownloadFailedException as e:
        print("\n--- A download error occurred ---")
        print("The server sent back an error page instead of an image.")
        print(f"Status Code: {e.response.status_code}")
        print("Server response snippet:")
        print(e.response.text[:500])
        print("---------------------------------")

    except Exception as e:
        print(f"An unexpected error occurred during the radar pass: {e}")
        # This could be due to network issues, Sentinel Hub errors, or db problems.

if __name__ == "__main__":
    perform_radar_pass()
