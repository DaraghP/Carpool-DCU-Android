from . import views
from django.urls import path, include

urlpatterns = [
    path("", views.index, name="test"),
    path("register", views.register, name="register"),
    path("login", views.login, name="login")
]
