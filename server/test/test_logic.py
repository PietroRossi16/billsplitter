import pytest
from server.app import calculate_split

def test_calculate_split_basic():
    data = {
        'num_ppl': 4,
        'tot_days': 30,
        'pairs': [
            {'name': 'Pietro', 'num_days': 0},
            {'name': 'Jacopo', 'num_days': 8},
            {'name': 'Josef', 'num_days': 5},
            {'name': 'Francesco', 'num_days': 29.5}
        ],
        'tax_rate': 5,
        'elec_std_rate_pence': 22.87,
        'elec_tot_charge': 35.77,
        'gas_std_rate_pence': 10.47,
        'gas_tot_charge': 13.40,
        'wifi_tot_charge': 10,
        'tv_tot_charge': 15
    }
    result = calculate_split(data)
    print(result)
    assert 'results' in result
    assert len(result['results']) == 4
    assert all('name' in r and 'days' in r and 'share' in r for r in result['results'])
    assert result['all_good'] is True or result['error'] < 0.1
    # Check that the sum of shares is close to the total
    total = sum(r['share'] for r in result['results'])
    expected_total = data['elec_tot_charge'] + data['gas_tot_charge'] + data['wifi_tot_charge'] + data['tv_tot_charge']
    assert abs(total - expected_total) < 0.1
