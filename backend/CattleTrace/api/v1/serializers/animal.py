"""Animal and breed serializers."""

from datetime import date, datetime

from rest_framework import serializers

from CattleTrace.models import Animal, Breed


class BreedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Breed
        fields = ('id', 'name', 'description')


class AnimalSerializer(serializers.ModelSerializer):
    breed_detail = BreedSerializer(source='breed', read_only=True)
    breed = serializers.PrimaryKeyRelatedField(
        queryset=Breed.objects.all(),
        allow_null=True,
        required=False,
    )
    age_months = serializers.IntegerField(read_only=True)
    current_owner = serializers.PrimaryKeyRelatedField(read_only=True)
    registered_by = serializers.PrimaryKeyRelatedField(read_only=True)
    registration_date = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = (
            'id',
            'tag_number',
            'rfid_tag',
            'name',
            'uuid',
            'breed',
            'breed_detail',
            'sex',
            'date_of_birth',
            'age_months',
            'color',
            'markings',
            'current_owner',
            'current_farm',
            'dam',
            'sire',
            'status',
            'photo',
            'registered_by',
            'registration_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'uuid',
            'age_months',
            'current_owner',
            'registered_by',
            'created_at',
            'updated_at',
        )

    def get_registration_date(self, obj):
        value = obj.registration_date
        if isinstance(value, datetime):
            return value.date()
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['current_owner'] = user
        validated_data['registered_by'] = user
        return super().create(validated_data)
