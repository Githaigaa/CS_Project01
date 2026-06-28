"""Settings and profile API tests."""

from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from CattleTrace.api.v1.tests.base import APITestCaseBase
from CattleTrace.models import User


class SettingsAPITests(APITestCaseBase):
    def test_update_profile_persists(self):
        self.authenticate(self.farmer)
        response = self.client.patch(
            reverse('api-v1:me'),
            {
                'first_name': 'Updated',
                'last_name': 'Farmer',
                'email': 'updated@example.com',
                'phone_number': '+254700000001',
                'location': 'Nairobi County',
                'bio': 'Livestock producer.',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['bio'], 'Livestock producer.')

        self.farmer.refresh_from_db()
        self.assertEqual(self.farmer.first_name, 'Updated')
        self.assertEqual(self.farmer.email, 'updated@example.com')
        self.assertEqual(self.farmer.bio, 'Livestock producer.')

    def test_update_profile_email_validation(self):
        User.objects.create_user(
            username='other',
            email='taken@example.com',
            password='test-pass-123',
            role=User.Role.BUYER,
        )
        self.authenticate(self.farmer)
        response = self.client.patch(
            reverse('api-v1:me'),
            {'email': 'taken@example.com'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)

    def test_upload_avatar(self):
        image = Image.new('RGB', (100, 100), color='red')
        buffer = BytesIO()
        image.save(buffer, format='JPEG')
        buffer.seek(0)
        upload = SimpleUploadedFile('avatar.jpg', buffer.read(), content_type='image/jpeg')

        self.authenticate(self.farmer)
        response = self.client.patch(
            reverse('api-v1:me_avatar'),
            {'profile_photo': upload},
            format='multipart',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['profile_photo'])

        self.farmer.refresh_from_db()
        self.assertTrue(bool(self.farmer.profile_photo))

    def test_update_preferences_persists(self):
        self.authenticate(self.farmer)
        response = self.client.patch(
            reverse('api-v1:me_preferences'),
            {
                'email': {'disease_alerts': False, 'system_updates': False},
                'sms': {'critical_health_alerts': True},
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['notification_preferences']['email']['disease_alerts'])
        self.assertTrue(response.data['notification_preferences']['sms']['critical_health_alerts'])

        self.farmer.refresh_from_db()
        self.assertFalse(self.farmer.notification_preferences['email']['disease_alerts'])
        self.assertTrue(self.farmer.notification_preferences['sms']['critical_health_alerts'])

    def test_change_password_persists(self):
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
        self.farmer.refresh_from_db()
        self.assertTrue(self.farmer.check_password('new-pass-456'))
