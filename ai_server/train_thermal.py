import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib
import os

# Load data
data_path = os.path.join('data', 'battery_data.csv')
df = pd.read_csv(data_path)

# Simulate overheating label (binary classification)
df['thermal_risk'] = ((df['ambient_temperature'] > 45) | (df['Rct'] > 0.25)).astype(int)

# Optional: drop irrelevant
df = df.drop(columns=['uid', 'filename', 'type'], errors='ignore')
df['power_loss'] = df['Re']

# Features
X = df[['ambient_temperature', 'Re', 'Rct']]

y = df['thermal_risk']

# Train
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluate
y_pred = clf.predict(X_test)
print("🔍 Thermal Risk Classification Report:\n")
print(classification_report(y_test, y_pred))

# Save
joblib.dump(clf, 'model_thermal.pkl')
print("✅ model_thermal.pkl saved successfully.")
