# Query performance notes

The claim list resolver fetches claim rows in one query. Nested `Claim.enrollment`, `Enrollment.plan`, and `Enrollment.user` relations are resolved through request-scoped DataLoaders. This avoids issuing one SQL statement per claim row (the classic N+1 pattern).

## Reproduce a local benchmark

1. Seed a local database and create a representative set of claims.
2. Run the API and obtain an HR token.
3. Use `autocannon -c 20 -d 30 -H 'authorization: Bearer TOKEN' -b '{"query":"{ claims { id enrollment { id plan { name } user { fullName } } } }"}' http://localhost:4000/graphql`.
4. Compare SQL statement counts with DataLoader enabled versus a deliberately unbatched resolver.

The 51-to-2 query count and 210ms-to-60ms p95 figures are target measurements from the project brief; results depend on hardware, dataset size, and concurrency. Re-run the benchmark before presenting them as independently reproduced measurements.
