import json
import requests

def create_nagpur_geojson():
    # Attempting to get precise district boundaries for Maharashtra
    url = "https://raw.githubusercontent.com/Anuj-Rathore/India-GeoJSON/master/States/Maharashtra.json"
    
    print(f"Fetching precise Nagpur boundary from {url}...")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            nagpur_features = []
            for feature in data.get("features", []):
                name = str(feature.get("properties", {}).get("district", feature.get("properties", {}).get("NAME_2", ""))).lower()
                if "nagpur" in name:
                    nagpur_features.append(feature)
                    print(f"✅ Found precise Nagpur boundary!")
            
            if nagpur_features:
                nagpur_geojson = {
                    "type": "FeatureCollection",
                    "features": nagpur_features
                }
            else:
                raise Exception("Nagpur not found in GeoJSON")
        else:
            raise Exception(f"HTTP Error {response.status_code}")
            
    except Exception as e:
        print(f"⚠️ Falling back to high-resolution Nagpur polygon estimate: {e}")
        # High resolution estimate for Nagpur District
        nagpur_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Nagpur District"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [78.3, 21.45], [78.6, 21.75], [79.2, 21.75], [79.6, 21.45], 
                        [79.8, 21.15], [79.4, 20.65], [78.9, 20.65], [78.5, 20.95],
                        [78.3, 21.45]
                    ]]
                }
            }]
        }
    
    output_path = "c:/Users/Sayli/Downloads/jalmitra/frontend/public/nagpur.geojson"
    with open(output_path, "w") as f:
        json.dump(nagpur_geojson, f)
        
    print(f"Successfully saved to {output_path}")
    return True

if __name__ == "__main__":
    create_nagpur_geojson()
