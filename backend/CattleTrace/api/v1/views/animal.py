"""Animal API viewset."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.permissions import IsAnimalOwnerOrStaff
from CattleTrace.api.v1.mixins import RoleScopedQuerysetMixin
from CattleTrace.api.v1.serializers import AnimalSerializer
from CattleTrace.api.v1.serializers.animal import AnimalPhotoSerializer
from CattleTrace.models import Animal, AnimalPhoto, User


class AnimalViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Animal.objects.select_related(
        'breed',
        'current_owner',
        'current_farm',
        'registered_by',
    ).all()
    serializer_class = AnimalSerializer
    permission_classes = (IsAuthenticated, IsAnimalOwnerOrStaff)
    lookup_field = 'tag_number'
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ('tag_number', 'rfid_tag', 'name')
    ordering_fields = ('registration_date', 'date_of_birth', 'created_at')
    ordering = ('-registration_date',)
    owner_field = 'current_owner'
    allow_buyer_read = True

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.BUYER:
            return queryset.filter(status=Animal.Status.ALIVE)
        return queryset

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="photos",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def photos(self, request, tag_number=None):
        animal = self.get_object()

        if request.method == "GET":
            photos = animal.photos.all()
            serializer = AnimalPhotoSerializer(photos, many=True, context={"request": request})
            return Response(serializer.data)

        # POST — add a new photo
        if animal.photos.count() >= 5:
            return Response(
                {"detail": "Maximum of 5 photos allowed per animal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AnimalPhotoSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(animal=animal, order=animal.photos.count())
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"photos/(?P<photo_id>\d+)",
    )
    def photo_delete(self, request, tag_number=None, photo_id=None):
        animal = self.get_object()
        try:
            photo = animal.photos.get(pk=photo_id)
        except AnimalPhoto.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
