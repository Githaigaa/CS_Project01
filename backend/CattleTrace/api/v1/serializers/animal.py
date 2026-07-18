"""Animal and breed serializers."""

from datetime import date, datetime

from rest_framework import serializers

from CattleTrace.models import Animal, AnimalPhoto, Breed


class AnimalPhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AnimalPhoto
        fields = ("id", "image", "image_url", "url", "order", "uploaded_at")
        read_only_fields = ("id", "image_url", "uploaded_at")

    def get_image_url(self, obj):
        if not obj.image:
            return obj.url or None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def validate(self, attrs):
        if not attrs.get("image") and not attrs.get("url"):
            raise serializers.ValidationError("Provide either an image file or a URL.")
        return attrs


class BreedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Breed
        fields = ('id', 'name', 'description')


class AnimalSerializer(serializers.ModelSerializer):
    breed_detail = BreedSerializer(source='breed', read_only=True)
    photos = AnimalPhotoSerializer(many=True, read_only=True)
    photo = serializers.SerializerMethodField()

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
    breed = serializers.PrimaryKeyRelatedField(
        queryset=Breed.objects.all(),
        allow_null=True,
        required=False,
    )
    age_months = serializers.IntegerField(read_only=True)
    current_owner = serializers.PrimaryKeyRelatedField(read_only=True)
    registered_by = serializers.PrimaryKeyRelatedField(read_only=True)
    registration_date = serializers.SerializerMethodField()
    current_owner_name = serializers.SerializerMethodField()
    current_farm_name = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = (
            'id',
            'tag_number',
            'rfid_tag',
            'name',
            'uuid',
            'species',
            'breed',
            'breed_detail',
            'breed_name',
            'age_class',
            'sex',
            'date_of_birth',
            'age_months',
            'color',
            'markings',
            'current_owner',
            'current_owner_name',
            'current_farm',
            'current_farm_name',
            'dam',
            'sire',
            'status',
            'photo',
            'photos',
            'registered_by',
            'registration_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'uuid',
            'age_months',
            'status',
            'current_owner',
            'current_owner_name',
            'current_farm_name',
            'registered_by',
            'created_at',
            'updated_at',
        )

    def get_registration_date(self, obj):
        value = obj.registration_date
        if isinstance(value, datetime):
            return value.date()
        return value

    def get_current_owner_name(self, obj):
        if not obj.current_owner:
            return None
        owner = obj.current_owner
        full_name = owner.get_full_name().strip()
        return full_name or owner.username

    def get_current_farm_name(self, obj):
        if not obj.current_farm:
            return None
        return obj.current_farm.name

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['current_owner'] = user
        validated_data['registered_by'] = user
        return super().create(validated_data)


# Statuses a farmer may set directly; SOLD is system-managed (marketplace transaction).
FARMER_ALLOWED_STATUSES = [
    Animal.Status.ALIVE,
    Animal.Status.STOLEN,
    Animal.Status.DECEASED,
    Animal.Status.SLAUGHTERED,
]


class AnimalStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[(s.value, s.label) for s in FARMER_ALLOWED_STATUSES])

    def validate_status(self, value):
        animal = self.instance
        # Prevent un-doing a system-managed state
        locked = {Animal.Status.SOLD, Animal.Status.SLAUGHTERED}
        if animal.status in locked:
            raise serializers.ValidationError(
                f"Cannot change status of an animal that is already '{animal.get_status_display()}'."
            )
        return value

    def update(self, instance, validated_data):
        instance.status = validated_data['status']
        instance.save(update_fields=['status'])
        return instance
