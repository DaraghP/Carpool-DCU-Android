from rest_framework import serializers
from .models import CarpoolUser


class CarpoolUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarpoolUser
        fields = ["username", "password"]
        extra_kwargs = {'password': {'write_only': True}}

    @staticmethod
    def check_registration_data(data):
        error_type = None
        error_message = None
        if len(data["username"]) < 1:
            error_type = "username"
            error_message = "Username field cannot be empty."
        elif len(data["username"]) > 150:
            error_type = "username"
            error_message = "Username must be no longer than 150 characters."
        elif CarpoolUser.objects.filter(username=data["username"]).count() > 0:
            error_type = "username"
            error_message = "Username already exists."
        elif len(data["password"]) < 6:
            error_type = "password"
            error_message = "Password must be at least 6 characters long."
        elif len(data["password"]) > 128:
            error_type = "password"
            error_message = "Password must be no longer than 128 characters."
        elif data["password"] != data["reEnteredPassword"]:
            error_type = "non_matching_passwords"
            error_message = "Passwords do not match."
        if error_type:
            return {"errorType": error_type, "errorMessage": error_message}

        return True

    def create(self, valid_data):
        user = CarpoolUser(username=valid_data['username'])
        user.set_password(valid_data['password'])
        user.is_admin = False
        user.save()
        return user
