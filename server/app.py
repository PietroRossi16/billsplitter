from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def calculate_split(data):
    try:
        num_ppl = int(data['num_ppl'])
        tot_days = float(data['tot_days'])
        pairs = data['pairs']  # list of {name, num_days}
        tax_rate = float(data['tax_rate'])
        elec_std_rate_pence = float(data['elec_std_rate_pence'])
        elec_tot_charge = float(data['elec_tot_charge'])
        gas_std_rate_pence = float(data['gas_std_rate_pence'])
        gas_tot_charge = float(data['gas_tot_charge'])
        wifi_tot_charge = float(data['wifi_tot_charge'])
        tv_tot_charge = float(data['tv_tot_charge'])
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
    result = calculate_split(data)
    # Only return 400 if there is a real error
    if 'error' in result and (result['error'] != 0 or not result.get('all_good', False)):
        return jsonify(result), 400
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True) 