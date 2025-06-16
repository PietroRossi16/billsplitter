from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

def safe_float(val):
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0

def safe_int(val):
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0

def calculate_split(data):
    try:
        print("num_ppl:", data['num_ppl'])
        print("tot_days:", data['tot_days'])
        print("pairs:", data['pairs'])
        print("tax_rate:", data.get('tax_rate', 0))
        print("elec_std_rate_pence:", data.get('elec_std_rate_pence', 0))
        print("elec_tot_charge:", data.get('elec_tot_charge', 0))
        print("gas_std_rate_pence:", data.get('gas_std_rate_pence', 0))
        print("gas_tot_charge:", data.get('gas_tot_charge', 0))
        print("wifi_tot_charge:", data.get('wifi_tot_charge', 0))
        print("tv_tot_charge:", data.get('tv_tot_charge', 0))
        num_ppl = safe_int(data.get('num_ppl', 0))
        tot_days = safe_float(data.get('tot_days', 0))
        pairs = data.get('pairs', [])
        tax_rate = safe_float(data.get('tax_rate', 0))
        elec_std_rate_pence = safe_float(data.get('elec_std_rate_pence', 0))
        elec_tot_charge = safe_float(data.get('elec_tot_charge', 0))
        gas_std_rate_pence = safe_float(data.get('gas_std_rate_pence', 0))
        gas_tot_charge = safe_float(data.get('gas_tot_charge', 0))
        wifi_tot_charge = safe_float(data.get('wifi_tot_charge', 0))
        tv_tot_charge = safe_float(data.get('tv_tot_charge', 0))
    except (KeyError, ValueError, TypeError):
        return {'error': 'Invalid input'}

    comb_days = sum([float(p['num_days']) for p in pairs])
    tax_rate_dec = tax_rate / 100
    elec_std_rate_pounds = elec_std_rate_pence / 100
    elec_std_charge = round(elec_std_rate_pounds * tot_days * (1 + tax_rate_dec), 2)
    gas_std_rate_pounds = gas_std_rate_pence / 100
    gas_std_charge = round(gas_std_rate_pounds * tot_days * (1 + tax_rate_dec), 2)

    def fair_share(days):
        if comb_days == 0:
            return round((elec_tot_charge + gas_tot_charge + wifi_tot_charge + tv_tot_charge) / num_ppl, 2)
        else:
            return round((elec_std_charge + gas_std_charge + wifi_tot_charge + tv_tot_charge) / num_ppl + (elec_tot_charge - elec_std_charge + gas_tot_charge - gas_std_charge) * days / comb_days, 2)

    results = []
    check_count = 0
    for p in pairs:
        name = p['name']
        days = float(p['num_days'])
        share = fair_share(days)
        results.append({
            'name': name,
            'days': days,
            'share': share
        })
        check_count += share

    error = abs(gas_tot_charge + elec_tot_charge + wifi_tot_charge + tv_tot_charge - check_count)
    all_good = error <= 0.01 * num_ppl

    return {
        'results': results,
        'all_good': all_good,
        'error': error
    }

@app.route('/api/split', methods=['POST'])
def split_bills():
    data = request.json
    print("Received data:", data)
    result = calculate_split(data)
    print("Response:", result)
    if 'error' in result and (result['error'] != 0 or not result.get('all_good', False)):
        return jsonify(result), 400
    return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0')