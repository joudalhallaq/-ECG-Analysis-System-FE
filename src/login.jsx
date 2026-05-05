import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import heartImage from './assets/heart.png'
function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/users/login/', {
        username,
        password,
      })

      localStorage.setItem('user_id', response.data.user_id)
      localStorage.setItem('username', response.data.username)

      navigate('/dashboard')
    } catch {
      setMessage('Invalid username or password')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card shadow-lg">

        {/* 🖼️ الصورة */}
        <div className="text-center mb-3">
          <img src={heartImage} alt="Heart" className="login-image" />        
          </div>

        <h2 className="text-center fw-bold">ECG Analysis System</h2>
        <p className="text-center text-muted mb-4">
          Heart monitoring for patients
        </p>

        <h5 className="text-center mb-3">Login</h5>

        <form onSubmit={handleLogin}>
          <input
            className="form-control mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-heart w-100">
            Login
          </button>
        </form>

        {message && (
          <div className="alert alert-danger mt-3">
            {message}
          </div>
        )}

        <div className="text-center mt-4">
          <span className="text-muted">Don’t have an account?</span>{' '}
          <Link to="/register" className="fw-bold">
            Register
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Login