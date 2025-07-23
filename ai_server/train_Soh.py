# ai_server/train.py

import pandas as pd
import numpy as np  # ✅ Needed for sqrt
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error

# Load data
data_path = os.path.join('data', 'battery_data.csv')
df = pd.read_csv(data_path)

# Drop unused columns
df = df.drop(columns=['uid', 'filename', 'type'], errors='ignore')

# Add power loss column (assuming I = 1A for simplicity)
df['power_loss'] = df['Re']  # Power loss = I^2 * Re (I=1)

# Optional: Label health status (for future classification models)
def label_status(soh):
    if soh >= 0.8:
        return 'Healthy'
    elif soh >= 0.6:
        return 'Degrading'
    else:
        return 'Scrap'

df['health_status'] = df['Capacity'].apply(label_status)

# Input features & target
X = df[['ambient_temperature', 'Re', 'Rct']]

y = df['Capacity']  # This is SoH in your case

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
print("Model R² Score:", r2_score(y_test, y_pred))
print("RMSE:", np.sqrt(mean_squared_error(y_test, y_pred)))

# Save model
joblib.dump(model, 'model_soh.pkl')
print("✅ model_soh.pkl saved successfully.")
