from django.urls import reverse

from CattleTrace.models import MovementRecord

from .base import APITestCaseBase


class MovementAPITests(APITestCaseBase):
    def setUp(self):
        super().setUp()
        self.animal = self.create_animal(tag_number='KE-MOVE-1')

    def test_farmer_creates_movement_record(self):
        self.authenticate(self.farmer)
        payload = {
            'animal': self.animal.id,
            'origin_farm': self.farm.id,
            'destination_farm': self.farm.id,
            'origin_county': 'Kiambu',
            'destination_county': 'Nairobi',
            'move_date': '2024-03-01',
            'purpose': 'sale',
        }
        response = self.client.post(
            reverse('api-v1:movement-list'),
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['recorded_by'], self.farmer.id)

    def test_inspector_lists_all_movements(self):
        MovementRecord.objects.create(
            animal=self.animal,
            origin_county='Kiambu',
            destination_county='Nairobi',
            move_date='2024-03-01',
            purpose='sale',
            recorded_by=self.farmer,
        )
        self.authenticate(self.inspector)
        response = self.client.get(reverse('api-v1:movement-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
