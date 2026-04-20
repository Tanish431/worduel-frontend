import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { GamePage } from './pages/GamePage'
import { ChallengeNotification } from './components/ui/ChallengeNotification'

export default function App() {
  return (
    <BrowserRouter>
      <ChallengeNotification />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/game/:matchId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}