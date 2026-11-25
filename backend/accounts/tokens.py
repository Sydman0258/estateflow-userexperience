from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


def revoke_all_tokens(user):
    """Blacklist every refresh token issued to the user (sign out everywhere).

    Note: already-issued access tokens stay valid until they expire (15 min).
    """
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)
