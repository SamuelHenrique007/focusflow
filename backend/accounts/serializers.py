from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "name", "email", "password"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("O nome é obrigatório.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError("O e-mail é obrigatório.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")
        return value

    def create(self, validated_data):
        name = validated_data["name"].strip()
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            name=name,
        )
        return user


class LoginSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "")

        if not email:
            raise serializers.ValidationError({"email": "O e-mail é obrigatório."})

        if not password:
            raise serializers.ValidationError({"password": "A senha é obrigatória."})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "E-mail ou senha inválidos."})

        data = super().validate({
            "email": user.email,
            "password": password,
        })

        data["user"] = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }
        return data


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email"]