"""Shared API test helpers."""

from datetime import date

from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from CattleTrace.models import Animal, Breed, Farm, User


class APITestCaseBase(APITestCase):
    def setUp(self):
        self.farmer = User.objects.create_user(
            username='farmer1',
            password='test-pass-123',
            role=User.Role.FARMER,
        )
        self.buyer = User.objects.create_user(
            username='buyer1',
            password='test-pass-123',
            role=User.Role.BUYER,
        )
        self.vet = User.objects.create_user(
            username='vet1',
            password='test-pass-123',
            role=User.Role.VET,
        )
        self.inspector = User.objects.create_user(
            username='inspector1',
            password='test-pass-123',
            role=User.Role.INSPECTOR,
        )
        self.admin = User.objects.create_user(
            username='admin1',
            password='test-pass-123',
            role=User.Role.ADMIN,
        )
        self.breed = Breed.objects.create(name='Boran')
        self.farm = Farm.objects.create(
            owner=self.farmer,
            name='Test Farm',
            registration_no='FARM-001',
            county='Kiambu',
        )

    def authenticate(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def create_animal(self, tag_number='KE-001', owner=None):
        return Animal.objects.create(
            tag_number=tag_number,
            breed=self.breed,
            sex=Animal.Sex.MALE,
            date_of_birth=date(2022, 1, 1),
            current_owner=owner or self.farmer,
            current_farm=self.farm,
            registered_by=owner or self.farmer,
        )
