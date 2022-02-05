import re
from rest_framework import serializers
from .models import CarpoolUser
import phonenumbers


class CarpoolUserSerializer(serializers.ModelSerializer):
    """
    CarpoolUser serializer used for registering users.
    """

    class Meta:
        model = CarpoolUser

        fields = ["username", "password", "first_name", "last_name", "phone_no"]
        extra_kwargs = {'password': {'write_only': True}}

    @classmethod
    def check_phone_number(cls, phone_number):
        """
        Checks the phone number if its valid (or used for testing).

        :param phone_number:
        :return: boolean, True if phone number is valid, False otherwise
        """
        phone_number = str(phone_number)
        
        fake_numbers_for_testing = {"0"}
        if phone_number in fake_numbers_for_testing:
            return True
   
        try: 
            phone_number = phonenumbers.parse(phone_number, "IE") 
            return phonenumbers.is_valid_number(phone_number)
        except phonenumbers.phonenumberutil.NumberParseException:
            return False

    @staticmethod
    def check_registration_data(data):
        """
        This is used in the API for /register,
        it checks if each field entered through the app is valid in the order each field is in.

        :param data:
        :return: True, if all fields are valid, otherwise a dict containing the appropriate error type and message is returned
        """

        error_type = None
        error_message = None
        
        if len(data["first_name"]) < 1:
            error_type = "first_name"
            error_message = "This field cannot be empty."
        elif not re.sub("['-]", "", data["first_name"]).isalpha():
            error_type = "first_name"
            error_message = "Names can only contain letters."
        elif len(data["last_name"]) < 1: 
            error_type = "last_name"
            error_message = "This field cannot be empty."
        elif not re.sub("['-]", "", data["last_name"]).isalpha():
            error_type = "last_name"
            error_message = "Names can only contain letters."
        elif not CarpoolUserSerializer.check_phone_number(data["phone_no"]):
            error_type = "phone"
            error_message = "Please enter a valid Irish phone number."
        elif len(data["username"]) < 1:
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
        user.first_name = valid_data["first_name"] # 
        user.last_name = valid_data["last_name"]
        user.is_admin = False
        user.save()
        return user
