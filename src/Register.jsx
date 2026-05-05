import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "./api";
import heartImage from "./assets/hero.png";
import "./App.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await API.post("/users/register/", formData);

      setMessage("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Registration failed. Please try again."
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
          <h1>Create Account</h1>
          <p className="subtitle">Register to start analyzing ECG files.</p>

          <form onSubmit={handleRegister}>
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Choose a password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {message && (
              <p
                className={
                  message.includes("successfully")
                    ? "success-message"
                    : "error-message"
                }
              >
                {message}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
