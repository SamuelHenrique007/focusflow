import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { resetPasswordRequest } from "@/services/auth";
import FeedbackMessage from "@/components/ui/FeedbackMessage";

type ResetPasswordErrorResponse = {
  detail?: string;
  new_password?: string[];
  confirm_new_password?: string[];
};

export default function ResetPassword() {
  const { uid = "", token = "" } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validatePasswords() {
    if (!newPassword || !confirmNewPassword) {
      return "Preencha todos os campos.";
    }

    if (newPassword.length < 8) {
      return "A senha deve possuir pelo menos 8 caracteres.";
    }

    if (newPassword !== confirmNewPassword) {
      return "As senhas não coincidem.";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validatePasswords();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordRequest({
        uid,
        token,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });

      setSuccessMessage(response.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error: unknown) {

      let message =
        "Não foi possível redefinir a senha. Verifique se o link ainda é válido.";

      if (error instanceof AxiosError) {

        const data = error.response?.data as
          | ResetPasswordErrorResponse
          | undefined;

        message =
          data?.detail ||
          data?.new_password?.[0] ||
          data?.confirm_new_password?.[0] ||
          message;

      } else if (error instanceof Error) {

        message = error.message;

      }

      setErrorMessage(message);

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <h1 className="text-2xl font-bold text-slate-900">
          Nova senha
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Defina sua nova senha para acessar sua conta.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >

          <div>
            <label className="text-sm font-semibold text-slate-800">
              Nova senha
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite sua nova senha"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>


          <div>
            <label className="text-sm font-semibold text-slate-800">
              Confirmar nova senha
            </label>

            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>


          <FeedbackMessage
            message={errorMessage}
            variant="error"
          />

          <FeedbackMessage
            message={successMessage}
            variant="success"
          />


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>

        </form>

      </div>
    </div>
  );
}