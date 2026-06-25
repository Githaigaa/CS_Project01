"""Slaughter record serializers."""

from rest_framework import serializers

from CattleTrace.models import Abattoir, SlaughterRecord


class AbattoirSerializer(serializers.ModelSerializer):
    class Meta:
        model = Abattoir
        fields = (
            'id',
            'name',
            'license_no',
            'county',
            'address',
            'contact',
            'is_active',
        )


class SlaughterRecordSerializer(serializers.ModelSerializer):
    inspector = serializers.PrimaryKeyRelatedField(read_only=True)
    dressing_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    animal_tag = serializers.CharField(source='animal.tag_number', read_only=True)
    abattoir_detail = AbattoirSerializer(source='abattoir', read_only=True)

    class Meta:
        model = SlaughterRecord
        fields = (
            'id',
            'animal',
            'animal_tag',
            'abattoir',
            'abattoir_detail',
            'slaughter_date',
            'slaughter_no',
            'live_weight_kg',
            'carcass_weight_kg',
            'dressing_percentage',
            'hide_weight_kg',
            'offal_weight_kg',
            'inspector',
            'inspection_result',
            'condemnation_reason',
            'meat_grade',
            'notes',
            'created_at',
        )
        read_only_fields = ('id', 'inspector', 'dressing_percentage', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        if user.role in (user.Role.INSPECTOR, user.Role.ADMIN):
            validated_data['inspector'] = user
        return super().create(validated_data)
