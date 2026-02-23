import json
import requests

def create_vidarbha_geojson():
    # Try multiple known good URLs
    urls = [
        "https://raw.githubusercontent.com/udit-001/india-maps-data/master/geojson/states/Maharashtra.geojson",
        "https://raw.githubusercontent.com/geohacker/india/master/state/maharashtra/district.geojson",
        "https://raw.githubusercontent.com/HindustanTimesLabs/shapefiles/master/india/state/maharashtra/district.json",
        "https://raw.githubusercontent.com/Anuj-Rathore/India-GeoJSON/master/States/Maharashtra.json"
    ]
    
    vidarbha_districts = {
        "akola", "amravati", "buldhana", "buldana", "washim", "yavatmal",
        "bhandara", "chandrapur", "gadchiroli", "gondia", "gondiya", "nagpur", "wardha"
    }
    
    data = None
    for url in urls:
        print(f"Trying Fetching from {url}...")
        try:
            # Change master to main if needed automatically
            response = requests.get(url, timeout=10)
            if response.status_code == 404 and 'master' in url:
                response = requests.get(url.replace('master', 'main'), timeout=10)
                
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found data from {url}")
                break
        except Exception as e:
            print(f"❌ Failed: {e}")
            
    if not data:
        # Emergency hardcoded simplified polygon for Vidarbha if all fetches fail
        # This covers the 11 districts roughly
        print("⚠️ Falling back to simplified Vidarbha polygon...")
        vidarbha_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Vidarbha Region (Simplified Boundary)"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [75.9, 21.3], [76.8, 21.6], [78.5, 21.4], [79.5, 21.7], [80.5, 21.5],
                        [80.8, 20.5], [80.3, 19.5], [80.5, 18.5], [79.5, 18.8], [78.8, 19.5],
                        [77.2, 19.2], [76.5, 19.5], [75.9, 19.8], [75.9, 21.3]
                    ]]
                }
            }]
        }
    else:
        vidarbha_features = []
        found_names = set()
        
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            # Look through all property values to see if any match a Vidarbha district name
            match = False
            for k, v in props.items():
                if str(v).lower() in vidarbha_districts:
                    match = True
                    found_names.add(str(v))
                    break
            
            if match:
                vidarbha_features.append(feature)
        
        if vidarbha_features:
            print(f"Matched {len(vidarbha_features)} features for districts: {list(found_names)}")
            vidarbha_geojson = {
                "type": "FeatureCollection",
                "features": vidarbha_features
            }
        else:
            print("❌ No features matched, using simplified polygon.")
            vidarbha_geojson = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {"name": "Vidarbha Region (Simplified Boundary)"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [75.9, 21.3], [76.8, 21.6], [78.5, 21.4], [79.5, 21.7], [80.5, 21.5],
                            [80.8, 20.5], [80.3, 19.5], [80.5, 18.5], [79.5, 18.8], [78.8, 19.5],
                            [77.2, 19.2], [76.5, 19.5], [75.9, 19.8], [75.9, 21.3]
                        ]]
                    }
                }]
            }
    
    output_path = "c:/Users/Sayli/Downloads/jalmitra/frontend/public/vidarbha.geojson"
    with open(output_path, "w") as f:
        json.dump(vidarbha_geojson, f)
        
    print(f"Successfully saved to {output_path}")
    return True

if __name__ == "__main__":
    create_vidarbha_geojson()
