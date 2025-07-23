import sys
import json
import pandas as pd
import xgboost as xgb
import shap
import os

# ✅ Step 1: Read Input Features from Node.js
try:
    features = json.loads(sys.argv[1])
except Exception as e:
    print(json.dumps({"error": f"Invalid input format: {str(e)}"}))
    sys.exit(1)

# ✅ Step 2: Convert input to DataFrame
X_input = pd.DataFrame([features])

# ✅ Step 3: Load NASA Battery Dataset
csv_path = os.path.join(os.path.dirname(__file__), "../datasets/nasa_battery_data.csv")
try:
    df = pd.read_csv(csv_path)
except FileNotFoundError:
    print(json.dumps({"error": "Dataset file not found"}))
    sys.exit(1)

# ✅ Step 4: Select features & target
feature_cols = ["ambient_temperature", "Re", "Rct"]
target_col = "Capacity"

# Drop rows with missing values
df = df.dropna(subset=feature_cols + [target_col])

# Separate input and output
X = df[feature_cols]
y = df[target_col] * 100  # Convert capacity (0–1) to percentage (0–100)

# ✅ Step 5: Train model
model = xgb.XGBRegressor()
model.fit(X, y)

# ✅ Step 6: Predict SoH for given input
prediction = float(model.predict(X_input)[0])

# ✅ Step 7: SHAP Explainability
explainer = shap.Explainer(model, X)
shap_values = explainer(X_input)
shap_contrib = {col: float(val) for col, val in zip(X_input.columns, shap_values.values[0])}

# ✅ Step 8: Return as JSON
result = {
    "prediction": round(prediction, 2),
    "shap": shap_contrib
}

print(json.dumps(result))
