from flask import Flask, request, jsonify
from flask_cors import CORS
from decimal import Decimal, ROUND_HALF_UP

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

    # Calculate total days across all people
    total_days = sum(Decimal(str(p["num_days"])) for p in data["pairs"])
    num_people = len(data["pairs"])
    print(f"Total days: {total_days}")
    print(f"Number of people: {num_people}")

    # Get VAT rate and convert to decimal
    vat_rate = Decimal(str(data.get("tax_rate", 0))) / Decimal('100')
    vat_multiplier = Decimal('1') + vat_rate
    print(f"VAT rate: {vat_rate}")
    print(f"VAT multiplier: {vat_multiplier}")

    # Calculate fixed costs
    fixed_costs = Decimal('0.00')
    elec_fixed = Decimal('0.00')
    gas_fixed = Decimal('0.00')
    
    # Add WiFi to fixed costs
    if "wifi_tot_charge" in data:
        fixed_costs += Decimal(str(data["wifi_tot_charge"]))
    
    # Add TV to fixed costs
    if "tv_tot_charge" in data:
        fixed_costs += Decimal(str(data["tv_tot_charge"]))
    
    # Add electricity standing rate to fixed costs
    if "elec_std_rate_pence" in data and "tot_days" in data:
        elec_std_rate = Decimal(str(data["elec_std_rate_pence"])) / Decimal('100')  # Convert pence to pounds, keeping all decimals
        elec_std_days = Decimal(str(data["tot_days"]))
        elec_fixed = elec_std_rate * elec_std_days * vat_multiplier  # Apply VAT to fixed costs
        fixed_costs += elec_fixed
        print(f"Electricity standing rate: {elec_std_rate}")
        print(f"Electricity days: {elec_std_days}")
        print(f"Electricity fixed cost: {elec_fixed}")
    
    # Add gas standing rate to fixed costs
    if "gas_std_rate_pence" in data and "tot_days" in data:
        gas_std_rate = Decimal(str(data["gas_std_rate_pence"])) / Decimal('100')  # Convert pence to pounds, keeping all decimals
        gas_std_days = Decimal(str(data["tot_days"]))
        gas_fixed = gas_std_rate * gas_std_days * vat_multiplier  # Apply VAT to fixed costs
        fixed_costs += gas_fixed
        print(f"Gas standing rate: {gas_std_rate}")
        print(f"Gas days: {gas_std_days}")
        print(f"Gas fixed cost: {gas_fixed}")

    print(f"Total fixed costs: {fixed_costs}")

    # Calculate variable costs
    variable_costs = Decimal('0.00')
    
    # Add electricity variable costs
    if "elec_tot_charge" in data:
        elec_total = Decimal(str(data["elec_tot_charge"]))
        elec_variable = elec_total - elec_fixed
        variable_costs += elec_variable
        print(f"Electricity total: {elec_total}")
        print(f"Electricity variable: {elec_variable}")
    
    # Add gas variable costs
    if "gas_tot_charge" in data:
        gas_total = Decimal(str(data["gas_tot_charge"]))
        gas_variable = gas_total - gas_fixed
        variable_costs += gas_variable
        print(f"Gas total: {gas_total}")
        print(f"Gas variable: {gas_variable}")

    print(f"Total variable costs: {variable_costs}")

    # Calculate each person's share
    for person in data["pairs"]:
        name = person["name"]
        days = Decimal(str(person["num_days"]))
        
        # Fixed costs are split equally
        fixed_share = fixed_costs / num_people
        
        # Variable costs are split proportionally to days
        variable_share = (variable_costs * days / total_days) if total_days > 0 else Decimal('0.00')
        
        # Total share is the sum of fixed and variable shares, only round at the very end
        share = round_decimal(fixed_share + variable_share)
        total_share += share
        
        print(f"\nPerson: {name}")
        print(f"Days: {days}")
        print(f"Fixed share: {fixed_share}")
        print(f"Variable share: {variable_share}")
        print(f"Total share: {share}")
        
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
    
    print(f"\nExpected total: {expected_total}")
    print(f"Calculated total: {total_share}")
    
    # Check if the sum of shares matches the total (within a small tolerance)
    tolerance = Decimal('0.01')
    if abs(total_share - expected_total) > tolerance:
        all_good = False
        error = abs(total_share - expected_total)
        print(f"Error: {error}")
    
    return jsonify({
        "results": results,
        "all_good": all_good,
        "error": float(error)
    })

if __name__ == "__main__":
    app.run(debug=True) 