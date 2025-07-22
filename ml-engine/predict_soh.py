# ml-engine/predict_soh.py

import sys
import json

def predict_soh(voltage, temperature, cycles):
    base = 100
    degradation = (0.05 * cycles) + (0.02 * (temperature - 25))
    soh = max(50, base - degradation)
    return round(soh, 2)

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    voltage = input_data["voltage"]
    temperature = input_data["temperature"]
    cycles = input_data["cycles"]

    soh = predict_soh(voltage, temperature, cycles)
    print(json.dumps({"soh": soh}))
