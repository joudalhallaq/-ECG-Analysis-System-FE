import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "./api";
import heartImage from "./assets/login-image.png";
import "./App.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await API.post("/users/login/", formData);

      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("username", response.data.username);

      navigate("/dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.error || "Login failed. Please check your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-image">
          <img src={heartImage} alt="ECG heart" />
        </div>

        <div className="auth-content">
          <h1>ECG Analysis System</h1>
          <p className="subtitle">Login to analyze ECG records and view results.</p>

          <form onSubmit={handleLogin}>
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {message && <p className="error-message">{message}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="switch-text">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
