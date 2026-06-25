"""Movement record and permit serializers."""

from rest_framework import serializers

from CattleTrace.models import MovementPermit, MovementRecord


class MovementPermitSerializer(serializers.ModelSerializer):
    issued_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = MovementPermit
        fields = (
            'id',
            'permit_number',
            'issued_by',
            'issued_on',
            'valid_until',
            'status',
            'notes',
        )
        read_only_fields = ('id', 'issued_by', 'issued_on')

    def create(self, validated_data):
        user = self.context['request'].user
        if user.role in (user.Role.INSPECTOR, user.Role.ADMIN):
            validated_data['issued_by'] = user
        return super().create(validated_data)


class MovementRecordSerializer(serializers.ModelSerializer):
    recorded_by = serializers.PrimaryKeyRelatedField(read_only=True)
    animal_tag = serializers.CharField(source='animal.tag_number', read_only=True)

    class Meta:
        model = MovementRecord
        fields = (
            'id',
            'animal',
            'animal_tag',
            'permit',
            'origin_farm',
            'destination_farm',
            'origin_county',
            'destination_county',
            'move_date',
            'purpose',
            'transporter',
            'vehicle_reg',
            'recorded_by',
            'gps_latitude',
            'gps_longitude',
            'created_at',
        )
        read_only_fields = ('id', 'recorded_by', 'created_at')

    def create(self, validated_data):
        validated_data['recorded_by'] = self.context['request'].user
        return super().create(validated_data)
