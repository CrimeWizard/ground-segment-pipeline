# engine/radar_pass.py

import os
import datetime
import numpy as np
from sentinelhub import (
    SHConfig,
    SentinelHubRequest,
    DataCollection,
    MimeType,
    CRS,
    BBox,
    bbox_to_dimensions,
)
from dotenv import load_dotenv

# Import the database client
from db_client import insert_metric

# --- Configuration ---

# Load environment variables from .env file
load_dotenv()

# Sentinel Hub configuration
# Assumes SENTINELHUB_CLIENT_ID and SENTINELHUB_CLIENT_SECRET are in your .env file
config = SHConfig()
config.sh_client_id = os.getenv("SENTINELHUB_CLIENT_ID")
config.sh_client_secret = os.getenv("SENTINELHUB_CLIENT_SECRET")

if not config.sh_client_id or not config.sh_client_secret:
    print("Warning: Sentinel Hub credentials not found in .env file.")
    print("Please add SENTINELHUB_CLIENT_ID and SENTINELHUB_CLIENT_SECRET.")

# --- Area of Interest (AOI) ---

# Coordinates for Ain Sokhna Port, Egypt
# Center point: 29.648028, 32.356364
# We'll create a bounding box around this point.
PORT_LAT = 29.648028
PORT_LON = 32.356364
BBOX_SIZE = 0.1  # In degrees

# Create a bounding box
ain_sokhna_bbox = BBox(
    bbox=(
        PORT_LON - BBOX_SIZE / 2,
        PORT_LAT - BBOX_SIZE / 2,
        PORT_LON + BBOX_SIZE / 2,
        PORT_LAT + BBOX_SIZE / 2,
    ),
    crs=CRS.WGS84,
)

# --- Evalscript for Sentinel-1 ---
# This script returns the VV polarization, which is good for ship detection.
# Ships typically have high backscatter and appear as bright spots.
evalscript_s1 = """
//VERSION=3
function setup() {
    return {
        input: ["VV", "dataMask"],
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
    Processes SAR data to count vessels.

    This is a placeholder implementation. A real implementation would use
    image processing techniques (e.g., thresholding, blob detection)
    to identify and count bright spots corresponding to ships.

    Args:
        sar_data: A NumPy array containing the SAR image data.

    Returns:
        The estimated number of ships.
    """
    # Placeholder logic:
    # A real implementation would be much more complex.
    # For now, let's simulate a detection by returning a random number.
    # This simulates that the analysis found a variable number of ships.
    print("Analyzing SAR data to count ships (using placeholder logic)...")
    detected_ships = np.random.randint(5, 25)
    print(f"Detected {detected_ships} potential vessels.")
    return detected_ships

# --- Main Execution ---

def perform_radar_pass():
    """
    Executes a full radar pass: fetching data, analyzing it, and storing the result.
    """
    print("Starting radar pass for Ain Sokhna port...")

    # Get the size of the image
    resolution = 10  # meters
    image_size = bbox_to_dimensions(ain_sokhna_bbox, resolution=resolution)

    # Create the request to Sentinel Hub
    request = SentinelHubRequest(
        evalscript=evalscript_s1,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=DataCollection.SENTINEL1_GRD,
                time_interval=("latest", "latest"), # Use the most recent data
            )
        ],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=ain_sokhna_bbox,
        size=image_size,
        config=config,
    )

    try:
        # Fetch data from Sentinel Hub
        print("Fetching Sentinel-1 SAR data...")
        sar_image = request.get_data()[0]
        print("Data fetched successfully.")

        # Process the data to count ships
        vessel_count = count_ships(sar_image)

        # Insert the result into the database
        print("Inserting metric into the database...")
        location_name = "Ain Sokhna"
        insert_metric(location=location_name, vessel_count=vessel_count)

        print("Radar pass completed successfully.")

    except Exception as e:
        print(f"An error occurred during the radar pass: {e}")
        # This could be due to network issues, Sentinel Hub errors, or db problems.

if __name__ == "__main__":
    perform_radar_pass()
