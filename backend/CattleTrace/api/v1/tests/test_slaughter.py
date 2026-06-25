from django.urls import reverse

from CattleTrace.models import Abattoir, SlaughterRecord

from .base import APITestCaseBase


class SlaughterAPITests(APITestCaseBase):
    def setUp(self):
        super().setUp()
        self.animal = self.create_animal(tag_number='KE-SLAUGHTER-1')
        self.abattoir = Abattoir.objects.create(
            name='City Abattoir',
            license_no='ABT-001',
            county='Nairobi',
        )

    def test_inspector_creates_slaughter_record(self):
        self.authenticate(self.inspector)
        payload = {
            'animal': self.animal.id,
            'abattoir': self.abattoir.id,
            'slaughter_date': '2024-04-01',
            'slaughter_no': 'SL-001',
            'live_weight_kg': '450.00',
            'carcass_weight_kg': '250.00',
            'inspection_result': SlaughterRecord.InspectionResult.PASSED,
        }
        response = self.client.post(
            reverse('api-v1:slaughter-record-list'),
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['inspector'], self.inspector.id)

    def test_authenticated_user_lists_abattoirs(self):
        self.authenticate(self.farmer)
        response = self.client.get(reverse('api-v1:abattoir-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
