"""Health record serializers."""

from rest_framework import serializers

from CattleTrace.models import Disease, HealthRecord, Vaccine


class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = ('id', 'name', 'description', 'is_notifiable')


class VaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccine
        fields = ('id', 'name', 'manufacturer', 'validity_days')


class HealthRecordSerializer(serializers.ModelSerializer):
    diagnosis_detail = DiseaseSerializer(source='diagnosis', read_only=True)
    vaccine_used_detail = VaccineSerializer(source='vaccine_used', read_only=True)
    vet = serializers.PrimaryKeyRelatedField(read_only=True)
    animal_tag = serializers.CharField(source='animal.tag_number', read_only=True)

    class Meta:
        model = HealthRecord
        fields = (
            'id',
            'animal',
            'animal_tag',
            'record_type',
            'date',
            'vet',
            'diagnosis',
            'diagnosis_detail',
            'vaccine_used',
            'vaccine_used_detail',
            'medication',
            'dosage',
            'next_due_date',
            'temperature',
            'notes',
            'certificate_no',
            'created_at',
        )
        read_only_fields = ('id', 'vet', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        if user.role == user.Role.VET:
            validated_data['vet'] = user
        return super().create(validated_data)
