import django.db.utils
import rest_framework.authtoken.models
from django.db import transaction
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from .models import *


# Create your tests here.

# Model Tests
class CarpoolUserTest(TestCase):
    """
    Tests for CarpoolUser model
    """

    def setUp(self):
        CarpoolUser.objects.create(username="user", password="123456", first_name="fname1", last_name="lname1", phone_no="0871234567")

    def test_username_integrity_constraint(self):
        try:
            with transaction.atomic():
                CarpoolUser.objects.create(username="user", first_name="fname1-1", last_name="lname1-1", phone_no="0871234567")
        except django.db.utils.IntegrityError:
            pass

    def test_user_creation(self):
        user = CarpoolUser.objects.create(username="user1", first_name="fname2", last_name="lname2", phone_no="0871234567", is_admin=True)
        self.assertEqual(user.username, "user1")
        self.assertEqual(user.first_name, "fname2")
        self.assertEqual(user.last_name, "lname2")
        self.assertEqual(user.phone_no, "0871234567")
        self.assertEqual(user.is_admin, True)


# API tests
class RegisterTestCase(APITestCase):
    """
    Tests for register
    """

    @classmethod
    def setUpTestData(cls):
        url = reverse("register")
        register_data = {
            "first_name": "userThree",
            "last_name": "userThree",
            "phone_no": "0871234567",
            "username": "user3",
            "password": "123456",
            "reEnteredPassword": "123456",
        }
        return url, register_data

    def test_register(self):
        """
        Normal registration
        """
        url, register_data = self.setUpTestData()

        response = self.client.post(url, register_data, format="json")

        new_user = CarpoolUser.objects.get(username="user3")
        token = Token.objects.get(user=new_user)

        self.assertEqual(token.key, response.data["token"])
        self.assertEqual(register_data["username"], "user3")

    def test_register_phonenumbers(self):
        """
        Test valid and invalid phone numbers
        """

        # with 097 instead of 087
        url, register_data = self.setUpTestData()
        register_data["phone_no"] = "0971234567"

        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

        # with letters
        register_data["phone_no"] = "08712345TS"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

        # with nothing
        register_data["phone_no"] = ""

        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

        # with non-printable characters
        register_data["phone_no"] = "             "

        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "phone")

    def test_register_existing_user(self):
        url, register_data = self.setUpTestData()
        self.client.post(url, register_data, format="json")
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Username already exists.")

    def test_matching_passowrds(self):
        url, register_data = self.setUpTestData()
        self.client.post(url, register_data, format="json")

        # matching
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # not matching
        register_data["username"] = "userFour"
        register_data["password"] = "not_matching"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorType"], "non_matching_passwords")

    def test_invalid_input_fields(self):
        url, register_data = self.setUpTestData()

        """
        Blank fields
        """
        register_data["first_name"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "This field cannot be empty.")

        register_data["first_name"] = "a"
        register_data["last_name"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "This field cannot be empty.")

        register_data["last_name"] = "a"
        register_data["username"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Username field cannot be empty.")

        register_data["username"] = "a"
        register_data["password"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Password must be at least 6 characters long.")

        register_data["first_name"] = ""
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "This field cannot be empty.")

        """
        Input lengths and character validation
        """
        register_data["first_name"] = "a135315"
        register_data["last_name"] = "a"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Names can only contain letters.")

        register_data["first_name"] = "a"
        register_data["last_name"] = "a135315"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Names can only contain letters.")

        register_data["last_name"] = "a"
        register_data["username"] = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        register_data["password"] = "123456"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Username must be no longer than 150 characters.")

        register_data["username"] = "a"
        register_data["password"] = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Password must be no longer than 128 characters.")

        register_data["password"] = "a"
        response = self.client.post(url, register_data, format="json")
        self.assertEqual(response.data["errorMessage"], "Password must be at least 6 characters long.")


class LoginTestCase(APITestCase):
    """
    Tests for login
    """

    @classmethod
    def setUpTestData(cls):
        url = reverse("login")
        login_data = {
            "username": "test",
            "password": "123456"
        }

        return url, login_data

    def test_login(self):
        """
        Normal login
        """

        # before user is registered
        self.assertNotEqual(True, self.client.login(username="user", password="123456"))

        user = CarpoolUser.objects.create_user(username="user", password="123456")
        Token.objects.create(user=user)

        # after user is registered
        self.assertEqual(True, self.client.login(username="user", password="123456"))


class LogoutTestCase(APITestCase):
    """
    Tests for logging out
    """

    def test_logout(self):
        user = CarpoolUser.objects.create_user(username="user", password="123456")
        token = Token.objects.create(user=user)
        authenticate(user)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.get(reverse("logout"))

        try:
            Token.objects.get(user=user)
            self.fail("Account token still stored after logout.")
        except rest_framework.authtoken.models.Token.DoesNotExist:
            pass


class DeleteAccountTestCase(APITestCase):
    """
    Tests for deleting account
    """

    def test_deleting_account(self):
        user = CarpoolUser.objects.create_user(username="user", password="123456")
        token = Token.objects.create(user=user)
        authenticate(user)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client.get(reverse("delete-account"))

        try:
            Token.objects.get(user=user)
            self.fail("Account details and token still stored after deletion.")
        except rest_framework.authtoken.models.Token.DoesNotExist:
            pass
