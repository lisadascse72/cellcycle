from flask import Flask, request, jsonify
from predict import predict_all  # centralized prediction logic
from flask_cors import CORS  # allow frontend access

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from frontend

@app.route('/')
def home():
    return "🔋 Battery Intelligence API is running."

# 🔁 Unified Prediction Endpoint
@app.route('/predict-all', methods=['POST'])
def full_prediction():
    try:
        input_data = request.get_json()
        result = predict_all(input_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 📍 Individual Endpoints (optional)
@app.route('/predict/soh', methods=['POST'])
def predict_soh():
    try:
        input_data = request.get_json()
        result = predict_all(input_data)
        return jsonify({"predicted_capacity": result.get("predicted_capacity")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict/rul', methods=['POST'])
def predict_rul():
    try:
        input_data = request.get_json()
        result = predict_all(input_data)
        return jsonify({"predicted_rul": result.get("predicted_rul")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict/type', methods=['POST'])
def predict_type():
    try:
        input_data = request.get_json()
        result = predict_all(input_data)
        return jsonify({"battery_type": result.get("battery_type")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
