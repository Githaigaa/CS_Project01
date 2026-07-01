"""Farm / holding serializers."""

from rest_framework import serializers

from CattleTrace.models import Farm


class FarmSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    owner_name = serializers.SerializerMethodField()
    animal_count = serializers.IntegerField(source='animals.count', read_only=True)
    restricted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = (
            'id',
            'owner',
            'owner_name',
            'name',
            'registration_no',
            'county',
            'sub_county',
            'ward',
            'gps_latitude',
            'gps_longitude',
            'total_area_acres',
            'animal_count',
            'is_restricted',
            'restriction_reason',
            'restricted_by',
            'restricted_by_name',
            'restricted_on',
            'created_at',
        )
        read_only_fields = ('id', 'owner', 'owner_name', 'animal_count', 'is_restricted',
                            'restriction_reason', 'restricted_by', 'restricted_by_name',
                            'restricted_on', 'created_at')

    def get_owner_name(self, obj):
        if not obj.owner:
            return None
        return obj.owner.get_full_name().strip() or obj.owner.username

    def get_restricted_by_name(self, obj):
        if not obj.restricted_by:
            return None
        return obj.restricted_by.get_full_name().strip() or obj.restricted_by.username

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
