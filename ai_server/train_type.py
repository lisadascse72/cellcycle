# ai_server/train_type.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib
import os

# Load data
df = pd.read_csv(os.path.join('data', 'battery_data.csv'))

# Only if 'type' column exists
if 'type' not in df.columns:
    raise ValueError("⚠️ 'type' column missing in CSV. Can't train type classifier.")

# Drop unnecessary columns
df = df.drop(columns=['uid', 'filename'], errors='ignore')

# Features and target
X = df[['ambient_temperature', 'Re', 'Rct']]

y = df['type']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Evaluation
y_pred = model.predict(X_test)
print("🔬 Battery Type Classification Report:\n")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, 'model_type.pkl')
print("✅ model_type.pkl saved successfully.")
