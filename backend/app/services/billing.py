def calculate_slab_bill(total_kwh: float) -> float:
    """
    Calculates the electricity bill based on a progressive waterfall slab system:
    - 0 to 100 units: ₹4.75 per unit
    - 101 to 200 units: ₹7.00 per unit
    - Above 200 units: ₹8.00 per unit
    """
    total = 0.0
    remaining = total_kwh

    # Slab 1: 0 to 100 units
    slab1_units = min(remaining, 100)
    total += slab1_units * 4.75
    remaining -= slab1_units

    if remaining <= 0:
        return round(total, 2)

    # Slab 2: 101 to 200 units
    slab2_units = min(remaining, 100)
    total += slab2_units * 7.00
    remaining -= slab2_units

    if remaining <= 0:
        return round(total, 2)

    # Slab 3: Above 200 units
    total += remaining * 8.00

    return round(total, 2)


# VoltBilling class for compatibility with existing simulator in main.py
class VoltBilling:
    def __init__(self, rate_per_unit=6.0, currency_symbol="₹"):
        self.rate = rate_per_unit
        self.currency = currency_symbol

    def calculate_slab_bill(self, units: float, state: str = None) -> float:
        # Compatibility wrapper that uses the new slab logic
        return calculate_slab_bill(units)