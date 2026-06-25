from django.urls import reverse

from .base import APITestCaseBase


class AuthAPITests(APITestCaseBase):
    def test_register_user(self):
        payload = {
            'username': 'newfarmer',
            'email': 'new@example.com',
            'password': 'secure-pass-123',
            'role': 'farmer',
        }
        response = self.client.post(reverse('api-v1:register'), payload, format='json')
        self.assertEqual(response.status_code, 201)

    def test_obtain_token_returns_user_payload(self):
        response = self.client.post(
            reverse('api-v1:token_obtain_pair'),
            {'username': 'farmer1', 'password': 'test-pass-123'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'farmer1')

    def test_me_endpoint_returns_profile(self):
        self.authenticate(self.farmer)
        response = self.client.get(reverse('api-v1:me'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'farmer1')

    def test_change_password(self):
        self.authenticate(self.farmer)
        response = self.client.post(
            reverse('api-v1:change_password'),
            {
                'current_password': 'test-pass-123',
                'new_password': 'new-pass-456',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_admin_role_registration_rejected(self):
        payload = {
            'username': 'badadmin',
            'email': 'bad@example.com',
            'password': 'secure-pass-123',
            'role': 'admin',
        }
        response = self.client.post(reverse('api-v1:register'), payload, format='json')
        self.assertEqual(response.status_code, 400)
