from django.utils import timezone


class UserLastSeenMiddleware:
    """Atualiza o last_seen_at apenas para usuários autenticados."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        user = getattr(request, "user", None)
        if getattr(user, "is_authenticated", False):
            user.__class__.objects.filter(pk=user.pk).update(last_seen_at=timezone.now())

        return response
