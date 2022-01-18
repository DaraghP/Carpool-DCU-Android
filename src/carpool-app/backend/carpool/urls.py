from . import views
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("", views.index, name="test"),
    path("register", views.register, name="register"),
    path("login", views.login, name="login"),
    path("token", obtain_auth_token, name="api-auth-token")
]
