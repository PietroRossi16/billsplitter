from flask import Flask, request, jsonify
from flask_cors import CORS
from decimal import Decimal, ROUND_HALF_UP
import math

app = Flask(__name__)
CORS(app)

def round_decimal(value, places=2):
    """Round a decimal number to specified places using ROUND_HALF_UP"""
    if value is None:
        return Decimal('0.00')
    return Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

@app.route("/api/split", methods=["POST"])
def split_bills():
    data = request.json
    results = []
    total_share = Decimal('0.00')
    all_good = True
    error = Decimal('0.00')

    # Process each person
    for person in data["pairs"]:
        name = person["name"]
        days = Decimal(str(person["num_days"]))
        total_days = Decimal(str(data["tot_days"]))
        
        # Calculate share for each service
        share = Decimal('0.00')
        
        # Electricity
        if "elec_std_rate_pence" in data and "elec_tot_charge" in data:
            std_rate = Decimal(str(data["elec_std_rate_pence"])) / Decimal('100')  # Convert pence to pounds
            tot_charge = Decimal(str(data["elec_tot_charge"]))
            tax_rate = Decimal(str(data.get("tax_rate", 0))) / Decimal('100')
            
            # Calculate fixed and variable costs
            fixed_cost = std_rate * total_days
            variable_cost = tot_charge - fixed_cost
            
            # Calculate person's share
            fixed_share = (fixed_cost / len(data["pairs"]))
            variable_share = (variable_cost * days / total_days)
            share += round_decimal(fixed_share + variable_share)
        
        # Gas
        if "gas_std_rate_pence" in data and "gas_tot_charge" in data:
            std_rate = Decimal(str(data["gas_std_rate_pence"])) / Decimal('100')  # Convert pence to pounds
            tot_charge = Decimal(str(data["gas_tot_charge"]))
            tax_rate = Decimal(str(data.get("tax_rate", 0))) / Decimal('100')
            
            # Calculate fixed and variable costs
            fixed_cost = std_rate * total_days
            variable_cost = tot_charge - fixed_cost
            
            # Calculate person's share
            fixed_share = (fixed_cost / len(data["pairs"]))
            variable_share = (variable_cost * days / total_days)
            share += round_decimal(fixed_share + variable_share)
        
        # WiFi
        if "wifi_tot_charge" in data:
            tot_charge = Decimal(str(data["wifi_tot_charge"]))
            share += round_decimal(tot_charge / len(data["pairs"]))
        
        # TV
        if "tv_tot_charge" in data:
            tot_charge = Decimal(str(data["tv_tot_charge"]))
            share += round_decimal(tot_charge / len(data["pairs"]))
        
        # Round the final share to 2 decimal places
        share = round_decimal(share)
        total_share += share
        
        results.append({
            "name": name,
            "days": float(days),
            "share": float(share)
        })
    
    # Calculate the total expected amount
    expected_total = Decimal('0.00')
    if "elec_tot_charge" in data:
        expected_total += Decimal(str(data["elec_tot_charge"]))
    if "gas_tot_charge" in data:
        expected_total += Decimal(str(data["gas_tot_charge"]))
    if "wifi_tot_charge" in data:
        expected_total += Decimal(str(data["wifi_tot_charge"]))
    if "tv_tot_charge" in data:
        expected_total += Decimal(str(data["tv_tot_charge"]))
    
    # Round the expected total
    expected_total = round_decimal(expected_total)
    
    # Check if the sum of shares matches the total (within a small tolerance)
    tolerance = Decimal('0.01')
    if abs(total_share - expected_total) > tolerance:
        all_good = False
        error = abs(total_share - expected_total)
    
    return jsonify({
        "results": results,
        "all_good": all_good,
        "error": float(error)
    })

if __name__ == "__main__":
    app.run(debug=True) 