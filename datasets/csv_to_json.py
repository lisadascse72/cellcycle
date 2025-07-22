import pandas as pd
import os

# File paths
csv_path = os.path.join(os.path.dirname(__file__), 'nasa_battery_data.csv')
json_path = os.path.join(os.path.dirname(__file__), '..', 'nasa_battery_data.json')

# Load CSV
df = pd.read_csv(csv_path)

# Convert to JSON
json_data = df.to_json(orient='records', lines=False)

# Save JSON
with open(json_path, 'w') as json_file:
    json_file.write(json_data)

print("✅ CSV converted to JSON successfully!")
