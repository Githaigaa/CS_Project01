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
    vet_name = serializers.SerializerMethodField()
    animal_tag = serializers.CharField(source='animal.tag_number', read_only=True)
    credibility_level_display = serializers.CharField(source='get_credibility_level_display', read_only=True)

    class Meta:
        model = HealthRecord
        fields = (
            'id',
            'animal',
            'animal_tag',
            'record_type',
            'date',
            'vet',
            'vet_name',
            'credibility_level',
            'credibility_level_display',
            'is_escalated',
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
        read_only_fields = ('id', 'vet', 'vet_name', 'credibility_level', 'is_escalated', 'created_at')

    def get_vet_name(self, obj):
        if not obj.vet:
            return None
        full_name = obj.vet.get_full_name().strip()
        return full_name or obj.vet.username

    def create(self, validated_data):
        user = self.context['request'].user
        if user.role in (user.Role.VET, user.Role.CAHW):
            validated_data['vet'] = user
        if user.role == user.Role.VET:
            validated_data['credibility_level'] = HealthRecord.CredibilityLevel.VET_VERIFIED
        elif user.role == user.Role.CAHW:
            validated_data['credibility_level'] = HealthRecord.CredibilityLevel.CAHW_OBSERVATION
        else:
            validated_data['credibility_level'] = HealthRecord.CredibilityLevel.SELF_REPORTED
        return super().create(validated_data)
