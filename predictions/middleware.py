from django.shortcuts import redirect

class RoleRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            profile = getattr(request.user, "userprofile", None)
            request.role = profile.role if profile else None
            request.outlet_id = profile.outlet_id if profile else None
        return self.get_response(request)
