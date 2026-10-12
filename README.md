# BenefitsGraph

A typed GraphQL API for employee benefits enrollment and insurance claims. Employees can view their own benefits and submit claims; HR administrators can manage plans and review claims.

## Stack
Node.js 20 · TypeScript · Apollo Server 4 · PostgreSQL · DataLoader · JWT · Jest · Docker · GitHub Actions

## Run locally

```bash
cp .env.example .env
docker compose up --build
```

The API is available at `http://localhost:4000/graphql`. Seeded accounts:

- HR admin: `hr@example.com` / `Password123!`
- Employee: `employee@example.com` / `Password123!`

For local development without Docker, run `npm install`, start PostgreSQL, then `npm run migrate && npm run seed && npm run dev`.

## Useful commands

```bash
npm test                 # Jest integration tests (requires TEST_DATABASE_URL)
npm run test:coverage
npm run lint
npm run typecheck
npm run migrate
npm run seed
```

## Authorization model
`EMPLOYEE` users can read their own profile, enrollment and claims, and submit claims for their own enrollment. `HR_ADMIN` users can list all claims, review claims, and inspect employee records. The API never trusts an employee ID supplied by an employee client.

## Data model
Six core tables: `users`, `benefit_plans`, `enrollments`, `claims`, `claim_events`, and `dependents`. SQL migration is in `db/migrations/001_init.sql`.

## Example operations

Login with `mutation { login(email: "employee@example.com", password: "Password123!") { token user { id fullName role } } }`. Send the returned token as `Authorization: Bearer <token>`. Employees can use `myClaims` and `submitClaim`; HR admins can use `claims` and `reviewClaim`.
