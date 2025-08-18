"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState(false)
  const router = useRouter()

  const isEmailValid = useMemo(() => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }, [email])

  const handleLogin = async () => {
    setError(null)
    setNetworkError(false)

    if (!isEmailValid || !password) {
      setError("Por favor, complete todos los campos correctamente.")
      return
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        if (response.status >= 500) {
          setError("Ocurrió un error en el servidor.")
          setNetworkError(true)
        } else {
          setError("El correo electrónico o la contraseña son incorrectos.")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("No se pudo conectar con el servidor. Revise su conexión.")
      setNetworkError(true)
    }
  }

  const isButtonDisabled = !isEmailValid || !password || networkError

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>
            ¡Bienvenido de nuevo! Accede a tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={email.length > 0 && !isEmailValid ? "border-red-500" : ""}
            />
            {email.length > 0 && !isEmailValid && (
              <p className="text-sm text-red-500">
                Por favor, ingrese un correo válido.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {networkError && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Recargar la página
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={isButtonDisabled}
          >
            Iniciar Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}