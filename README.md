# EstateFlow – Full-Stack Monthly Rentals Platform

Modern full-stack application for **direct monthly rentals from verified landlords**.

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4  
- **Backend**: Django 5 + Django REST Framework + SimpleJWT (2FA OTP auth)  
- **Design**: Pixel-faithful recreation of the provided landing page

---

## Project structure

```
estateflow/
├── backend/          # Django + DRF API
│   ├── accounts/     # Custom User, 2FA OTP, JWT
│   ├── properties/   # Property listings API
│   ├── landlord/     # Landlord profiles
│   ├── tenant/       # Tenant profiles
│   ├── payment/      # Payment models
│   └── reviews/      # Reviews
└── frontend/         # Next.js application
    └── src/
        ├── app/      # Pages (landing, browse, auth, detail)
        ├── components/
        └── lib/api.ts
```

---

## Quick start

### 1. Backend

```bash
cd backend

# Install deps (recommended: virtualenv)
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment (edit .env if needed)
# DATABASE_URL=sqlite:////tmp/estateflow.db   # or your preferred DB

python manage.py migrate
python manage.py runserver 8000
```

OTP codes appear in the terminal when using the console email backend.

**Demo landlord** (seeded):
- Email: `landlord@estateflow.demo`
- Password: `Password123!`

### 2. Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local
npm run dev
```

Open http://localhost:3000

---

## Features

### Landing page
Matches the provided design: hero search, curated homes cards, how-it-works steps, landlord CTA, responsive header/footer.

### API endpoints
- `GET /api/properties/` – public list of available homes
- `GET /api/properties/:id/` – detail
- Auth: register (tenant/landlord), activate OTP, 2FA login, JWT refresh, logout, /me

### Frontend routes
- `/` – Landing
- `/browse` – Browse all homes
- `/properties/[id]` – Property detail
- `/auth/login` – 2FA sign-in
- `/auth/register/landlord` – Landlord signup

---

## Notes

- Frontend falls back to curated sample data if the API is unreachable.
- Images use Unsplash placeholders (deterministic per property id).
- Backend includes strong 2FA, rate limiting, and role-based permissions.

Enjoy!
