import sys
import json
import shap
import xgboost as xgb
import pandas as pd

try:
    features = json.loads(sys.argv[1])
except:
    print(json.dumps({"error": "Invalid input format"}))
    sys.exit(1)

# Convert to DataFrame
X = pd.DataFrame([features])

# Dummy training
model = xgb.XGBRegressor()
model.fit(X, [85])  # Pretend actual SoH is 85%

# SHAP explainability
explainer = shap.Explainer(model)
shap_values = explainer(X)

# Convert SHAP values to native Python floats
shap_contrib = {col: float(val) for col, val in zip(X.columns, shap_values.values[0])}

result = {
    "prediction": float(model.predict(X)[0]),  # 👈 float() conversion
    "shap": shap_contrib
}

print(json.dumps(result))
