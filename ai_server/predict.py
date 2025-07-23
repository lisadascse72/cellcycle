import joblib
import numpy as np
import os

# Load all models
model_soh = joblib.load(os.path.join('model_soh.pkl'))
model_rul = joblib.load(os.path.join('model_rul.pkl'))
model_thermal = joblib.load(os.path.join('model_thermal.pkl'))
model_efficiency = joblib.load(os.path.join('model_efficiency.pkl'))
model_type = joblib.load(os.path.join('model_type.pkl'))
model_anomaly = joblib.load(os.path.join('model_anomaly.pkl'))

# Battery type labels (for interpretability)
type_labels = {
    -1: "Li-ion",
    0: "NiMH",
    1: "NiCd"
}

def predict_all(input_data):
    """
    Accepts input in the format:
    {
        "ambient_temperature": 25,
        "Re": 0.05,
        "Rct": 0.17
    }
    Returns dictionary of predictions.
    """
    try:
        # Extract required features
        at = float(input_data['ambient_temperature'])
        re = float(input_data['Re'])
        rct = float(input_data['Rct'])

        # Derived feature
        power_loss = re  # assuming I = 1A ⇒ P = I² * Re = Re

        # Unified input for all models
        X = np.array([[at, re, rct]])


        # Run predictions
        soh_pred = model_soh.predict(X)[0]
        rul_pred = model_rul.predict(X)[0]
        thermal_risk = model_thermal.predict(X)[0]
        efficiency = model_efficiency.predict(X)[0]
        type_class = int(model_type.predict(X)[0])
        is_anomaly = model_anomaly.predict(X)[0]

        # Format the results
        return {
            "predicted_capacity": round(soh_pred, 4),
            "predicted_rul": round(rul_pred),
            "thermal_status": "Overheating" if thermal_risk else "Normal",
            "predicted_efficiency": round(efficiency, 4),
            "battery_type": type_labels.get(type_class, "Unknown"),
            "anomaly_detected": bool(is_anomaly)
        }

    except KeyError as e:
        return {"error": f"Missing input key: {str(e)}"}
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}
