# ai_server/train_rul.py

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import numpy as np
import os

# Load and preprocess data
data_path = os.path.join('data', 'battery_data.csv')
df = pd.read_csv(data_path)

# Drop unnecessary columns
df = df.drop(columns=['uid', 'filename', 'type'], errors='ignore')

# Simulate RUL for training (basic estimation)
degradation_rate = 0.002  # Assume 1 cycle = 0.002 capacity loss
df['RUL'] = ((df['Capacity'] - 0.6) / degradation_rate).clip(lower=0)

# Add power loss again
df['power_loss'] = df['Re']

# Features and label
X = df[['ambient_temperature', 'Re', 'Rct']]
y = df['RUL']

# Split & train
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("RUL Model R² Score:", r2_score(y_test, y_pred))
print("RUL RMSE:", np.sqrt(mean_squared_error(y_test, y_pred)))

# Save model
joblib.dump(model, 'model_rul.pkl')
print("✅ model_rul.pkl saved successfully.")
