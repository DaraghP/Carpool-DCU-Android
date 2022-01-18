from rest_framework import serializers
from .models import CarpoolUser


class CarpoolUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarpoolUser
        fields = ["username", "password"]
        extra_kwargs = {'password': {'write_only': True}}

    @staticmethod
    def check_registration_data(data):
        if len(data["username"]) < 1:
            return "Username field cannot be empty."
        elif len(data["username"]) > 150:
            return "Username must be no longer than 150 characters."
        elif CarpoolUser.objects.filter(username=data["username"]).count() > 0:
            return "Username already exists."
        elif len(data["password"]) < 6:
            return "Password must be at least 6 characters long."
        elif len(data["password"]) > 128:
            return "Password must be no longer than 128 characters."
        elif data["password"] != data["reEnteredPassword"]:
            return "Passwords do not match."
        else:
            return True

    def create(self, valid_data):
        user = CarpoolUser(username=valid_data['username'])
        user.set_password(valid_data['password'])
        user.is_admin = False
        user.save()
        return user
