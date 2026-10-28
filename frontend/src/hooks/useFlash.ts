import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useFlash() {
  const location = useLocation()
  const navigate = useNavigate()

  const message = (location.state as { flash?: string } | null)?.flash ?? null

  function clearFlash() {
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }, 4000)
    return () => clearTimeout(timer)
  }, [message, location.pathname, location.search, navigate])

  return {
    message,
    clear: clearFlash,
  }
}
