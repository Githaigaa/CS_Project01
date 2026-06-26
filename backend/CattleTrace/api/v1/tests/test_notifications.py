"""Notification API tests."""

from CattleTrace.api.v1.tests.base import APITestCaseBase
from CattleTrace.models import Notification


class NotificationAPITests(APITestCaseBase):
    def setUp(self):
        super().setUp()
        self.notification = Notification.objects.create(
            recipient=self.farmer,
            notification_type=Notification.NotificationType.DISEASE_ALERT,
            title='FMD Outbreak',
            message='Immediate quarantine required.',
        )
        Notification.objects.create(
            recipient=self.farmer,
            notification_type=Notification.NotificationType.MOVEMENT_APPROVED,
            title='Movement Approved',
            message='Permit approved.',
            is_read=True,
        )
        Notification.objects.create(
            recipient=self.buyer,
            notification_type=Notification.NotificationType.LISTING_INQUIRY,
            title='New inquiry',
            message='Buyer inquiry on listing.',
        )

    def test_list_notifications_scoped_to_recipient(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        titles = {item['title'] for item in response.data['results']}
        self.assertIn('FMD Outbreak', titles)
        self.assertNotIn('New inquiry', titles)

    def test_unread_count(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/notifications/unread-count/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['disease_alerts_count'], 1)

    def test_filter_unread(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/notifications/', {'is_read': 'false'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_mark_as_read(self):
        self.authenticate(self.farmer)
        response = self.client.patch(
            f'/api/v1/notifications/{self.notification.id}/',
            {'is_read': True},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_read'])
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_mark_all_as_read(self):
        self.authenticate(self.farmer)
        response = self.client.post('/api/v1/notifications/mark-all-read/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['updated'], 1)
        self.assertFalse(
            Notification.objects.filter(recipient=self.farmer, is_read=False).exists(),
        )

    def test_delete_notification(self):
        self.authenticate(self.farmer)
        response = self.client.delete(f'/api/v1/notifications/{self.notification.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Notification.objects.filter(id=self.notification.id).exists())

    def test_cannot_access_other_users_notification(self):
        self.authenticate(self.buyer)
        response = self.client.get(f'/api/v1/notifications/{self.notification.id}/')
        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_access_denied(self):
        response = self.client.get('/api/v1/notifications/')
        self.assertEqual(response.status_code, 401)
