from django.urls import reverse

from .base import APITestCaseBase


class HoldingAPITests(APITestCaseBase):
    def test_farmer_lists_own_holdings(self):
        self.authenticate(self.farmer)
        response = self.client.get(reverse('api-v1:holding-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['registration_no'], 'FARM-001')

    def test_farmer_creates_holding(self):
        self.authenticate(self.farmer)
        payload = {
            'name': 'Second Farm',
            'registration_no': 'FARM-002',
            'county': 'Nakuru',
        }
        response = self.client.post(reverse('api-v1:holding-list'), payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['owner'], self.farmer.id)

    def test_buyer_cannot_list_holdings(self):
        self.authenticate(self.buyer)
        response = self.client.get(reverse('api-v1:holding-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)
