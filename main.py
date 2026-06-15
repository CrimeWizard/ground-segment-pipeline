import os
import numpy as np
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from sentinelhub import SentinelHubRequest, DataCollection, MimeType, CRS, BBox, SHConfig

# 1. Load Environment Configuration
load_dotenv()
config = SHConfig()
config.sh_client_id = os.getenv("SH_CLIENT_ID")
config.sh_client_secret = os.getenv("SH_CLIENT_SECRET")

# Explicitly set BOTH URLs for Copernicus Data Space Ecosystem
config.sh_base_url = "https://sh.dataspace.copernicus.eu"
config.sh_token_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

if not config.sh_client_id or not config.sh_client_secret:
    print("ERROR: Could not load credentials from .env file!")
    exit(1)

# 2. Define Area of Interest (Bounding Box over New Cairo region)
bbox = BBox(bbox=[31.45, 30.00, 31.50, 30.05], crs=CRS.WGS84)

# 3. Custom Evaluation Script (Calculates both True Color and NDVI)
evalscript = """
//VERSION=3
function setup() {
    return {
        input: ["B02", "B03", "B04", "B08"],
        output: [
            { id: "true_color", bands: 3 },
            { id: "ndvi", bands: 1 }
        ]
    };
}

function evaluatePixel(sample) {
    let red = sample.B04 * 2.5;
    let green = sample.B03 * 2.5;
    let blue = sample.B02 * 2.5;
    let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
    
    return {
        true_color: [red, green, blue],
        ndvi: [ndvi]
    };
}
"""

# 4. Build the API Request
request = SentinelHubRequest(
    evalscript=evalscript,
    input_data=[
        SentinelHubRequest.input_data(
            data_collection=DataCollection.SENTINEL2_L2A.define_from(
                "s2l2a_cdse", service_url=config.sh_base_url
            ),
            time_interval=("2026-05-01", "2026-05-31")
        )
    ],
    responses=[
        SentinelHubRequest.output_response("true_color", MimeType.PNG),
        SentinelHubRequest.output_response("ndvi", MimeType.TIFF)
    ],
    bbox=bbox,
    size=(512, 512),
    config=config
)

print("Fetching data from Copernicus satellite system...")

try:
    images = request.get_data()

    # If the API found zero satellite passes in May 2026, it might return an empty list
    if len(images) == 0:
        print("Error: The satellite API returned 0 images. No data available for this timeframe.")
        exit(1)

    # 5. Extract and Save the Output Files
    # The API packages multiple outputs into a single dictionary
    data_dict = images[0]
    
    print(f"Data downloaded successfully. Unpacking keys: {list(data_dict.keys())}")

    # Safely extract by dynamically finding the correct dictionary keys
    true_color_key = next((k for k in data_dict.keys() if "true_color" in k), None)
    ndvi_key = next((k for k in data_dict.keys() if "ndvi" in k), None)

    if not true_color_key or not ndvi_key:
        raise KeyError(f"Could not find required image outputs. Available keys: {data_dict.keys()}")

    true_color_img = data_dict[true_color_key]
    ndvi_data = data_dict[ndvi_key].squeeze() # Remove extra dimensions

    # Save True Color image
    # Save True Color image
    plt.imsave("new_cairo_true_color.png", true_color_img)
    print("Saved: new_cairo_true_color.png")

    # Save NDVI data with a colormap
    plt.imsave("new_cairo_ndvi.png", ndvi_data, cmap="RdYlGn")
    print("Saved: new_cairo_ndvi.png")

    print("Pipeline complete. Open your project directory to view the images!")

except Exception as e:
    import traceback
    print(f"\nAn error occurred during fetch/save: {e}")
    traceback.print_exc()
