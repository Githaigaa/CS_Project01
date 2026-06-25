from django.urls import reverse

from CattleTrace.models import MarketplaceListing

from .base import APITestCaseBase


class MarketplaceAPITests(APITestCaseBase):
    def setUp(self):
        super().setUp()
        self.animal = self.create_animal(tag_number='KE-MKT-1')

    def test_farmer_creates_listing(self):
        self.authenticate(self.farmer)
        payload = {
            'animal': self.animal.id,
            'asking_price': '150000.00',
            'location_county': 'Kiambu',
            'description': 'Healthy steer',
        }
        response = self.client.post(
            reverse('api-v1:marketplace-listing-list'),
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['seller'], self.farmer.id)

    def test_buyer_sees_active_listings(self):
        MarketplaceListing.objects.create(
            animal=self.animal,
            seller=self.farmer,
            asking_price=150000,
            location_county='Kiambu',
        )
        self.authenticate(self.buyer)
        response = self.client.get(reverse('api-v1:marketplace-listing-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_seller_cannot_inquire_on_own_listing(self):
        listing = MarketplaceListing.objects.create(
            animal=self.animal,
            seller=self.farmer,
            asking_price=150000,
            location_county='Kiambu',
        )
        self.authenticate(self.farmer)
        response = self.client.post(
            reverse('api-v1:marketplace-inquiry-list'),
            {'listing': listing.id, 'message': 'Interested'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
