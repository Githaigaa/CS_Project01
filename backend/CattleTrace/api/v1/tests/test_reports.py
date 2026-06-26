"""Reports API tests."""

from datetime import date

from CattleTrace.api.v1.tests.base import APITestCaseBase
from CattleTrace.models import Disease, DiseaseOutbreak, HealthRecord


class ReportsAPITests(APITestCaseBase):
    def setUp(self):
        super().setUp()
        self.animal = self.create_animal()
        self.disease = Disease.objects.create(name='FMD', is_notifiable=True)
        HealthRecord.objects.create(
            animal=self.animal,
            record_type=HealthRecord.RecordType.EXAMINATION,
            date=date.today(),
            diagnosis=self.disease,
        )
        DiseaseOutbreak.objects.create(
            disease=self.disease,
            county='Nakuru',
            severity=DiseaseOutbreak.Severity.HIGH,
            animals_affected=3,
        )

    def test_overview_report(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/', {'range': '90'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('regional_data', response.data)
        self.assertIn('monthly_revenue', response.data)
        self.assertIn('disease_data', response.data)
        self.assertIn('compliance', response.data)

    def test_herd_report(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/herd/', {'range': '365'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['report_type'], 'herd')
        self.assertGreaterEqual(response.data['summary']['total_animals'], 1)

    def test_health_report(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/health/', {'range': '30'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['report_type'], 'health')
        self.assertGreaterEqual(response.data['summary']['total_records'], 1)

    def test_movement_report(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/movement/', {'range': '30'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['report_type'], 'movement')

    def test_marketplace_report(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/marketplace/', {'range': '30'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['report_type'], 'marketplace')

    def test_slaughter_report(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/slaughter/', {'range': '30'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['report_type'], 'slaughter')

    def test_outbreak_report_staff_only(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/outbreak/', {'range': '30'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['total_outbreaks'], 0)

        self.authenticate(self.inspector)
        response = self.client.get('/api/v1/reports/outbreak/', {'range': '30'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['total_outbreaks'], 1)

    def test_csv_export(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/herd/export/', {'format': 'csv', 'range': '365'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('tag_number', response.content.decode())

    def test_invalid_report_type(self):
        self.authenticate(self.farmer)
        response = self.client.get('/api/v1/reports/invalid/')
        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_access_denied(self):
        response = self.client.get('/api/v1/reports/')
        self.assertEqual(response.status_code, 401)
