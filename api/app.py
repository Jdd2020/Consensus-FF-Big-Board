from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os
import json
import math

app = Flask(__name__)
CORS(app)

@app.route('/adp', methods=['GET'])
def get_adp():
    try:
        
        # Construct the path to the CSV
        csv_path = os.path.join(os.path.dirname(__file__), 'data', 'half_ppr_adp.csv')

        # Read the CSV
        df = pd.read_csv(csv_path)

        # Clean the data - replace NaN values with None for proper JSON serialization
        df = df.fillna('')  # Replace NaN with empty string first
        
        # Remove any columns that are completely empty or problematic
        df = df.dropna(axis=1, how='all')
        
        # Example manipulation (optional)
        df['rank'] = df.index + 1

        # Get difference between ESPN APP and average ADP
        df["ESPN_SAVINGS"]  = df["ESPN Half"] - df["Average"]

        # Convert to dict and ensure clean JSON
        data = df.to_dict(orient='records')
        
        # Post-process to handle any remaining NaN issues
        import json
        import math
        def clean_nan(obj):
            if isinstance(obj, dict):
                return {k: clean_nan(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nan(v) for v in obj]
            elif isinstance(obj, float) and math.isnan(obj):
                return None
            else:
                return obj
        
        data = clean_nan(data)
        
        print(f"Returning {len(data)} records")
        return jsonify(data)

    except FileNotFoundError:
        return jsonify({"error": "CSV file not found"}), 404

    except Exception as e:
        print(f"Error in get_adp: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
