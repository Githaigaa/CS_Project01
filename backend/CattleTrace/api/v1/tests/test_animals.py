from django.urls import reverse

from CattleTrace.models import Animal

from .base import APITestCaseBase


class AnimalAPITests(APITestCaseBase):
    def test_farmer_lists_own_animals_only(self):
        self.create_animal(tag_number='KE-001')
        self.create_animal(tag_number='KE-002', owner=self.buyer)
        self.authenticate(self.farmer)

        response = self.client.get(reverse('api-v1:animal-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['tag_number'], 'KE-001')

    def test_farmer_creates_animal(self):
        self.authenticate(self.farmer)
        payload = {
            'tag_number': 'KE-100',
            'sex': Animal.Sex.FEMALE,
            'date_of_birth': '2023-05-01',
            'breed': self.breed.id,
            'current_farm': self.farm.id,
        }

        response = self.client.post(reverse('api-v1:animal-list'), payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['current_owner'], self.farmer.id)
        self.assertEqual(response.data['registered_by'], self.farmer.id)

    def test_unauthenticated_request_rejected(self):
        response = self.client.get(reverse('api-v1:animal-list'))
        self.assertEqual(response.status_code, 401)
