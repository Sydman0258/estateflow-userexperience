from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Authenticate using email + password.
    Case-insensitive email lookup. Uses ORM only (no raw SQL).
    """

    def authenticate(self, request, username=None, email=None, password=None, **kwargs):
        # Accept either 'email' or the classic 'username' kwarg (DRF / admin compatibility)
        email = email or username or kwargs.get(User.USERNAME_FIELD)
        if email is None or password is None:
            return None
        try:
            user = User.objects.get(email__iexact=email.strip())
        except User.DoesNotExist:
            # Run the default password hasher to mitigate timing attacks
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
