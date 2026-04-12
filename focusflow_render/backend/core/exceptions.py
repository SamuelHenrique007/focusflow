from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:

        translations = {
            "Authentication credentials were not provided.": "Credenciais de autenticação não foram fornecidas.",
            "Invalid token.": "Token inválido.",
            "Token is invalid or expired": "Token inválido ou expirado.",
            "Given token not valid for any token type": "Token inválido.",
            "User not found": "Usuário não encontrado.",
            "No active account found with the given credentials": "Email ou senha inválidos.",
        }

        if isinstance(response.data, dict):

            for key in response.data:

                message = response.data[key]

                if isinstance(message, list):

                    response.data[key] = [
                        translations.get(str(m), m)
                        for m in message
                    ]

                else:

                    response.data[key] = translations.get(
                        str(message),
                        message
                    )

    return response