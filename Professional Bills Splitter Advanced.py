#This is a way to split your bills amongst your flatmates

#Input the number of people in the flat
while True:
    try:
        num_ppl = int(input("How many people do you want to split the bills? (Must enter at least 2)"))
        if num_ppl >= 2:
            break
        else:
            print("Please enter a whole number greater than or equal to 2.")
    except ValueError:
        print("Please a whole number greater than or equal to 2.")

# Define the period of the bill
while True:
    try:
        tot_days = float(input("How many days do your bills cover?"))
        if tot_days > 0:
            break
        else:
            print("Please enter a number greater than 0.")
    except ValueError:
        print("Please a number greater than 0.")

# Collect the name-number of days pairs
pairs = []
comb_days = 0
for i in range(num_ppl):
    name = input(f"Enter name #{i + 1}: ")
    while True:
        try:
            num_days = float(input(f"For how many days was {name} at the property?"))
            if 0<= num_days <= tot_days:
                break
            else:
                print(f"Please enter a number between 0 and {int(tot_days * 100) / 100}")
        except ValueError:
            print("Please enter a number greater than or equal to 0.")
    pairs.append((name, num_days))
    comb_days += num_days

# Insert the tax rate for electricity and gas bill
while True:
    try:
        tax_rate = float(input("Insert the VAT available on your bills receipt (usually around 5%)"))
        if tax_rate >= 0:
            tax_rate_dec = tax_rate/100
            break
        else:
            print("Please enter a number greater than or equal to 0.")
    except ValueError:
        print("Please enter a number greater than or equal to 0.")

# Insert the electricity standing rate
while True:
    try:
        elec_std_rate_pence = float(input("Insert the electricity-related standing rate (before VAT, for example 27.89 p/day)"))
        if elec_std_rate_pence >= 0:
            elec_std_rate_pounds = elec_std_rate_pence/100
            break
        else:
            print("Please enter a number greater than or equal to 0.")
    except ValueError:
        print("Please enter a number greater than or equal to 0.")

# Find the electricity standing charge
elec_std_charge = round(elec_std_rate_pounds * tot_days * (1 + tax_rate_dec), 2)

# Insert the total electricity charge (after VAT)
while True:
    try:
        elec_tot_charge = float(input("Insert the electricity-related total charge (this should be after VAT)"))
        if elec_tot_charge >= 0:
            break
        else:
            print("Please enter a number greater than or equal to 0.")
    except ValueError:
        print("Please enter a number greater than or equal to 0.")

# Insert the gas standing rate (before VAT)
while True:
    try:
        gas_std_rate_pence = float(input("Insert the gas-related standing rate (before VAT, for example 27.89 p/day)"))
        if gas_std_rate_pence >= 0:
            gas_std_rate_pounds = gas_std_rate_pence/100
            break
        else:
            print("Please enter a number greater than or equal to 0.")
    except ValueError:
        print("Please enter a number greater than or equal to 0.")

# Find the gas standing charge
gas_std_charge = round(gas_std_rate_pounds * tot_days * (1 + tax_rate_dec), 2)

# Insert the total gas charge (after VAT)
while True:
    try:
        gas_tot_charge = float(input("Insert the gas-related total charge (this should be after VAT)"))
        if gas_tot_charge >= 0:
            break
        else:
            print("Please enter a number greater than or equal to 0.")
    except ValueError:
        print("Please enter a number greater than or equal to 0.")

# Insert the total wifi charge (after VAT)
while True:
    try:
        wifi_tot_charge = float(input("Insert the total cost from your Wifi bill (this should already be after VAT)"))
        if wifi_tot_charge >= 0:
            break
        else:
            print("Please enter a number greater than or equal to 0.")
    except ValueError:
        print("Please enter a number greater than or equal to 0.")

# Insert the total TV licence / pay-TV charge (after VAT)
while True:
    try:
        tv_tot_charge = float(input("Insert the total cost from your TV license or pay-TV bill (this should already be after VAT)"))
        if tv_tot_charge >= 0:
            break
        else:
            print("Please enter a number greater than or equal to 0.")
    except ValueError:
        print("Please enter a number greater than or equal to 0.")

# Define function for sharing bills fairly
def fair_share(days):
    if comb_days == 0:
        return round((elec_tot_charge + gas_tot_charge + wifi_tot_charge + tv_tot_charge) / num_ppl, 2)
    else:
        return round((elec_std_charge + gas_std_charge + wifi_tot_charge + tv_tot_charge) / num_ppl + (elec_tot_charge - elec_std_charge + gas_tot_charge - gas_std_charge) * days / comb_days, 2)

# Print output
check_count = 0
for i in range(num_ppl):
    print(f"{pairs[i][0]} stayed at home for {f'{pairs[i][1]:.2f}'.rstrip('0').rstrip('.')} out of {f'{tot_days:.2f}'.rstrip('0').rstrip('.')} days, and owes {fair_share(pairs[i][1])}")
    check_count += fair_share(pairs[i][1])

# Check the split fits
error = abs(gas_tot_charge + elec_tot_charge + wifi_tot_charge + tv_tot_charge - check_count)

if error <= 0.01 * num_ppl:
    print("All good!")
    print(error)
else:
    print("There's a mismatch in the calculations...")
    print(error)
