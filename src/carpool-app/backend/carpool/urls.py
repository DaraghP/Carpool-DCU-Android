from . import views
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("register", views.register, name="register"),
    path("login", views.login, name="login"),
    path("logout", views.logout, name="logout"),
    path("token", obtain_auth_token, name="api-auth-token"),
    path("delete", views.delete_account, name="delete-account"),
    path("get_driver", views.get_driver, name="get-driver"),
    path("create_driver", views.create_driver, name="create-driver"),
    path("create_trip", views.create_trip, name="create-trip")
]
