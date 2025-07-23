import pandas as pd
import os

# File paths (inside datasets folder itself)
csv_path = os.path.join(os.path.dirname(__file__), 'nasa_battery_data.csv')
json_path = os.path.join(os.path.dirname(__file__), 'sample_battery.json')

# Load CSV
df = pd.read_csv(csv_path)
df.dropna(inplace=True)  # optional cleanup

# Convert to JSON
df.to_json(json_path, orient='records', indent=2)

print("✅ CSV converted to sample_battery.json successfully!")
