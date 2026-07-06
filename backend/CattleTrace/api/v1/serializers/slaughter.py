"""Slaughter record serializers."""

from rest_framework import serializers

from CattleTrace.models import Abattoir, Animal, SlaughterRecord, User


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
    inspector_name = serializers.SerializerMethodField()
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
            'batch_number',
            'live_weight_kg',
            'carcass_weight_kg',
            'dressing_percentage',
            'hide_weight_kg',
            'offal_weight_kg',
            'inspector',
            'inspector_name',
            'inspection_result',
            'condemnation_reason',
            'meat_grade',
            'notes',
            'created_at',
        )
        read_only_fields = ('id', 'inspector', 'dressing_percentage', 'created_at')

    def get_inspector_name(self, obj):
        if obj.inspector:
            return obj.inspector.get_full_name() or obj.inspector.username
        return None

    def validate_animal(self, animal):
        if animal.status != Animal.Status.ALIVE:
            raise serializers.ValidationError(
                f"Cannot create a slaughter record for an animal with status "
                f"'{animal.get_status_display()}'. Only Active animals may be slaughtered."
            )
        return animal

    def create(self, validated_data):
        user = self.context['request'].user
        if user.role in (User.Role.INSPECTOR, User.Role.ABATTOIR, User.Role.ADMIN):
            validated_data['inspector'] = user
        return super().create(validated_data)
