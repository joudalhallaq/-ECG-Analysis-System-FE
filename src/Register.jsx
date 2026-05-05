import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    try {
      await axios.post('http://127.0.0.1:8000/api/users/register/', {
        username,
        email,
        password,
      })

      setMessage('Registration successful ✅')

      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (error) {
      if (error.response && error.response.data.error) {
        setMessage(error.response.data.error)
      } else {
        setMessage('Registration failed ❌')
      }
    }
  }

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">ECG Analysis System</h1>

      <div className="card p-4 shadow mx-auto" style={{ maxWidth: '500px' }}>
        <h3 className="mb-3">Register</h3>

        <form onSubmit={handleRegister}>
          <input
            className="form-control mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="email"
            className="form-control mb-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary w-100">Register</button>
        </form>

        {message && <div className="alert alert-info mt-3 mb-0">{message}</div>}

        <div className="mt-3 text-center">
          Already have an account? <Link to="/">Login</Link>
        </div>
      </div>
    </div>
  )
}

export default Register