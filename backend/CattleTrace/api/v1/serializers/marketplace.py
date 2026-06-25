"""Marketplace serializers."""

from rest_framework import serializers

from CattleTrace.models import Animal, MarketplaceInquiry, MarketplaceListing, Transaction

from .animal import AnimalSerializer


class MarketplaceListingSerializer(serializers.ModelSerializer):
    seller = serializers.PrimaryKeyRelatedField(read_only=True)
    animal_detail = AnimalSerializer(source='animal', read_only=True)
    animal = serializers.PrimaryKeyRelatedField(
        queryset=Animal.objects.filter(status=Animal.Status.ALIVE),
    )

    class Meta:
        model = MarketplaceListing
        fields = (
            'id',
            'animal',
            'animal_detail',
            'seller',
            'asking_price',
            'is_negotiable',
            'description',
            'location_county',
            'status',
            'listed_on',
            'expires_on',
            'views_count',
            'updated_at',
        )
        read_only_fields = ('id', 'seller', 'listed_on', 'views_count', 'updated_at')

    def validate_animal(self, animal):
        user = self.context['request'].user
        if animal.current_owner_id != user.id:
            raise serializers.ValidationError('You can only list animals you own.')
        if hasattr(animal, 'marketplace_listing'):
            raise serializers.ValidationError('This animal already has a listing.')
        return animal

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)


class MarketplaceInquirySerializer(serializers.ModelSerializer):
    buyer = serializers.PrimaryKeyRelatedField(read_only=True)
    listing = serializers.PrimaryKeyRelatedField(
        queryset=MarketplaceListing.objects.filter(status=MarketplaceListing.ListingStatus.ACTIVE),
    )

    class Meta:
        model = MarketplaceInquiry
        fields = (
            'id',
            'listing',
            'buyer',
            'message',
            'offer_price',
            'sent_at',
            'is_read',
        )
        read_only_fields = ('id', 'buyer', 'sent_at', 'is_read')

    def validate_listing(self, listing):
        user = self.context['request'].user
        if listing.seller_id == user.id:
            raise serializers.ValidationError('You cannot inquire on your own listing.')
        return listing

    def create(self, validated_data):
        validated_data['buyer'] = self.context['request'].user
        return super().create(validated_data)


class TransactionSerializer(serializers.ModelSerializer):
    buyer = serializers.PrimaryKeyRelatedField(read_only=True)
    seller = serializers.PrimaryKeyRelatedField(read_only=True)
    listing = serializers.PrimaryKeyRelatedField(
        queryset=MarketplaceListing.objects.filter(status=MarketplaceListing.ListingStatus.ACTIVE),
    )

    class Meta:
        model = Transaction
        fields = (
            'id',
            'listing',
            'buyer',
            'seller',
            'agreed_price',
            'payment_method',
            'payment_ref',
            'transaction_date',
            'notes',
        )
        read_only_fields = ('id', 'seller', 'transaction_date')

    def validate_listing(self, listing):
        user = self.context['request'].user
        if listing.seller_id == user.id:
            raise serializers.ValidationError('You cannot purchase your own listing.')
        return listing

    def create(self, validated_data):
        listing = validated_data['listing']
        validated_data['buyer'] = self.context['request'].user
        validated_data['seller'] = listing.seller
        return super().create(validated_data)
