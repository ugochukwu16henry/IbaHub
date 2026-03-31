# Retail backfill / cutover notes

## Objective
Move data from gateway-fed retail upstream into native IbaHub retail tables introduced in `0012_retail_native_parity.sql`.

## Suggested order
1. Warehouses
2. Categories
3. Brands
4. Units
5. Items (map foreign keys by team + name)
6. Orders and order items
7. POS transactions
8. Inventory adjustments

## Cutover steps
1. Enable native writes (`/api/retail/*`) while keeping gateway read fallback.
2. Run backfill in dry-run mode and validate counts by team.
3. Run final backfill with writes blocked to upstream.
4. Switch all retail UI reads to native endpoints.
5. Deprecate legacy gateway retail routes after one full billing cycle.
