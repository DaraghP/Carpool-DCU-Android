from rest_framework import serializers
from .models import CarpoolUser
import phonenumbers


class CarpoolUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarpoolUser
        # fields = ["username", "password"]
        fields = ["username", "password", "first_name", "last_name", "phone_no"]
        extra_kwargs = {'password': {'write_only': True}}

    @classmethod
    def check_phone_number(cls, phone_number):
        phone_number = str(phone_number)
        
        fake_numbers_for_testing = set({})
        if phone_number in fake_numbers_for_testing:
            return True
        
        phone_number = phonenumbers.parse(phone_number, "IE")

        return phonenumbers.is_valid_number(phone_number)      

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
        elif len(data["first_name"]) < 1 or len(data["last_name"]) < 1:
            error_type = "person_name"
            error_message = "First or last name fields cannot not be empty."
        elif not CarpoolUserSerializer.check_phone_number(data["phone_no"]):
            error_type = "phone"
            error_message = "Phone number is invalid."
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
        user.first_name = valid_data["first_name"] # 
        user.last_name = valid_data["last_name"]# good question
        user.is_admin = False
        user.save()
        return user
