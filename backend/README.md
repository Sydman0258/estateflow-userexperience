# UserExperience – Secure Auth & Property Platform

Security-first Django + DRF backend with **mandatory two-factor authentication** (email OTP).

## Auth Features

- **Registration** (Tenant / Landlord) → account created inactive, OTP emailed
- **Account activation** via OTP
- **Login is 2FA**:
  1. `POST /api/auth/login/` with email + password → OTP sent
  2. `POST /api/auth/login/verify/` with email + password + OTP → JWT + session issued
- Dual authentication: **JWT** (stateless) **and** Django **sessions**
- Short-lived access tokens (15 min), rotating refresh tokens, blacklist support
- Rate-limited OTP resend, attempt counters, temporary account lockout
- All queries via Django ORM – **no raw SQL** (SQL-injection resistant by design)
- Vital fields cross-validated in serializers (email/username uniqueness, password strength, role forced server-side)

## Quick start

```bash
cd userexperience
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# edit .env – set SECRET_KEY and email backend if needed

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

With `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` (default) OTP codes appear in the terminal.

## Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/tenant/` | Register tenant |
| POST | `/api/auth/register/landlord/` | Register landlord |
| POST | `/api/auth/activate/` | Activate with OTP |
| POST | `/api/auth/otp/resend/` | Resend OTP |
| POST | `/api/auth/login/` | Factor 1 – credentials → OTP |
| POST | `/api/auth/login/verify/` | Factor 2 – credentials + OTP → tokens |
| POST | `/api/auth/token/refresh/` | Refresh JWT |
| POST | `/api/auth/logout/` | Invalidate session (+ optional refresh blacklist) |
| GET  | `/api/auth/me/` | Current user |

## Security notes

- Never expose `otp_secret_key` in API responses.
- Password min length 9 + Django validators.
- Throttling enabled for anon/user.
- Production: set `DEBUG=False`, strong `SECRET_KEY`, HTTPS, real SMTP, and tighten `CORS_ALLOWED_ORIGINS` / `ALLOWED_HOSTS`.
