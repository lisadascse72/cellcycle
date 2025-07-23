# ai_server/train_efficiency.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import joblib
import os
import numpy as np

# Load battery data
data_path = os.path.join('data', 'battery_data.csv')
df = pd.read_csv(data_path)

# Drop unnecessary columns
df = df.drop(columns=['uid', 'filename', 'type'], errors='ignore')

# Calculate approximate efficiency (dummy physics-based)
df['efficiency'] = 1 - (df['Re'] + df['Rct']) * 0.2
df['efficiency'] = df['efficiency'].clip(0, 1)  # Clip between 0 and 1

# Features and target
X = df[['ambient_temperature', 'Re', 'Rct']]

y = df['efficiency']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("⚙️ Efficiency Model R² Score:", r2_score(y_test, y_pred))
print("⚙️ Efficiency RMSE:", np.sqrt(mean_squared_error(y_test, y_pred)))

# Save model
joblib.dump(model, 'model_efficiency.pkl')
print("✅ model_efficiency.pkl saved successfully.")
