# ai_server/train_anomaly.py

import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

# Load data
df = pd.read_csv(os.path.join('data', 'battery_data.csv'))

# Drop unnecessary
df = df.drop(columns=['uid', 'filename', 'type'], errors='ignore')

# Features
X = df[['ambient_temperature', 'Re', 'Rct']]


# Train Isolation Forest
model = IsolationForest(contamination=0.05, random_state=42)
model.fit(X)

# Save model
joblib.dump(model, 'model_anomaly.pkl')
print("✅ model_anomaly.pkl saved successfully.")
