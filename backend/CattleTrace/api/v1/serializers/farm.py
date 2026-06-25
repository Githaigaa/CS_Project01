"""Farm / holding serializers."""

from rest_framework import serializers

from CattleTrace.models import Farm


class FarmSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    animal_count = serializers.IntegerField(source='animals.count', read_only=True)

    class Meta:
        model = Farm
        fields = (
            'id',
            'owner',
            'name',
            'registration_no',
            'county',
            'sub_county',
            'ward',
            'gps_latitude',
            'gps_longitude',
            'total_area_acres',
            'animal_count',
            'created_at',
        )
        read_only_fields = ('id', 'owner', 'animal_count', 'created_at')

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
