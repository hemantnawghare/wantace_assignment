# Decisions and Architecture Notes

## Stack choice

This application uses React + Vite for the customer-facing frontend and Express + MongoDB for the backend API. The separation reflects the need for a dynamic estimator that can load questions from configuration while keeping proprietary pricing logic on the server.

## Pricing formula

The backend pricing engine computes a midpoint estimate from roof area, material rate, pitch and story multipliers, tear-off cost, waste factor, permit fee, and spread percentage.

The formula is:

- Base material cost = roof_area × material_rate × (1 + waste_factor)
- Tear-off cost = roof_area × tear_off_rate
- Adjusted subtotal = (base material cost + tear-off cost) × pitch_multiplier × stories_multiplier
- Midpoint estimate = adjusted subtotal + permit_fee
- Low estimate = midpoint × (1 - range_spread)
- High estimate = midpoint × (1 + range_spread)

The default values used for the config are 10% waste, $350 permit fee, and 12% spread.

## Scope intentionally omitted

This project intentionally does not include sophisticated multi-tenant routing, fine-grained role permissions, or a full audit log system. The goal is a pragmatic estimator with admin config editing and lead capture, which matches the business need without introducing unnecessary complexity.

## Seed data / legacy handling

The configuration schema accepts numeric string values for multipliers and rates, which are normalized to numbers when the document is read and saved. This keeps the setup compatible with legacy seed data while working correctly with modern numeric handling.

## Questions to ask Dale before production launch

- Should the owner panel support multiple business regions or only a single Northline location?
- Do you want the admin UI to support multi-step versioning and approvals for config changes?
- Should contact data be sent to a CRM after a lead is created?
- Are there any pricing rules or local code requirements for permits or inspection fees in different service areas?
- Should the estimator be expanded to support financing or financing estimate flows?
