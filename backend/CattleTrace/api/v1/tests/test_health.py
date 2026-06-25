from django.urls import reverse

from CattleTrace.models import HealthRecord

from .base import APITestCaseBase


class HealthEventAPITests(APITestCaseBase):
    def setUp(self):
        super().setUp()
        self.animal = self.create_animal(tag_number='KE-HEALTH-1')

    def test_vet_creates_health_event(self):
        self.authenticate(self.vet)
        payload = {
            'animal': self.animal.id,
            'record_type': HealthRecord.RecordType.VACCINATION,
            'date': '2024-01-15',
            'notes': 'Annual vaccination',
        }
        response = self.client.post(
            reverse('api-v1:health-event-list'),
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['vet'], self.vet.id)

    def test_farmer_lists_own_animal_health_events(self):
        HealthRecord.objects.create(
            animal=self.animal,
            record_type=HealthRecord.RecordType.EXAMINATION,
            date='2024-02-01',
        )
        self.authenticate(self.farmer)
        response = self.client.get(
            reverse('api-v1:health-event-list'),
            {'animal': self.animal.tag_number},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
