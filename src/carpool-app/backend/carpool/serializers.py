from rest_framework import serializers
from .models import CarpoolUser


class CarpoolUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarpoolUser
        fields = ["username", "password"]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, valid_data):
        user = CarpoolUser(username=valid_data['username'])
        user.set_password(valid_data['password'])
        user.is_admin = False
        user.save()
        return user
