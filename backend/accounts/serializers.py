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


class UpdateMeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["name", "email"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("O nome é obrigatório.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError("O e-mail é obrigatório.")

        user = self.context["request"].user
        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")

        return value

    def update(self, instance, validated_data):
        instance.name = validated_data["name"].strip()
        instance.email = validated_data["email"].strip().lower()
        instance.username = instance.email
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True, required=True)

    def validate_current_password(self, value):
        if not value:
            raise serializers.ValidationError("A senha atual é obrigatória.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        current_password = attrs.get("current_password", "")
        new_password = attrs.get("new_password", "")
        confirm_new_password = attrs.get("confirm_new_password", "")

        if not user.check_password(current_password):
            raise serializers.ValidationError(
                {"current_password": "A senha atual está incorreta."}
            )

        if new_password != confirm_new_password:
            raise serializers.ValidationError(
                {"confirm_new_password": "A confirmação da nova senha não confere."}
            )

        if current_password == new_password:
            raise serializers.ValidationError(
                {"new_password": "A nova senha deve ser diferente da senha atual."}
            )

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save()
        return user