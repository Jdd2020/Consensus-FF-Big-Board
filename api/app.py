from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

@app.route('/adp', methods=['GET'])
def get_adp():
    try:
        # Construct the path to the CSV
        csv_path = os.path.join(os.path.dirname(__file__), 'data', 'half_ppr_adp.csv')

        # Read the CSV
        df = pd.read_csv(csv_path)

        # Example manipulation (optional)
        df['rank'] = df.index + 1

        # Return as JSON
        return jsonify(df.to_dict(orient='records'))

    except FileNotFoundError:
        return jsonify({"error": "CSV file not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
