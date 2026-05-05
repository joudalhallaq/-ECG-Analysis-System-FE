import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "./api";
import heartImage from "./assets/new-auth-image.png";
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setMessage("Please enter username and password.");
      return;
    }

    setLoading(true);
    setMessage("Please wait. The server may take up to 60 seconds to wake up.");

    try {
      const response = await API.post("/users/login/", {
        username: formData.username.trim(),
        password: formData.password,
      });

      if (!response.data?.user_id) {
        setMessage("Login succeeded but user data was not returned correctly.");
        setLoading(false);
        return;
      }

      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("username", response.data.username || formData.username.trim());

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      console.log("Backend response:", error.response?.data);

      if (error.code === "ECONNABORTED") {
        setMessage("The server took too long to respond. Please try again.");
      } else {
        setMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Invalid username or password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-image-side">
            <div className="auth-image-box">
              <img
                src={heartImage}
                alt="Heart illustration"
                className="auth-image"
              />
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-form-content">
              <h1 className="auth-title">Login</h1>

              <p className="auth-subtitle">
                Access your account to analyze ECG records and manage your results.
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    className="auth-input"
                    autoComplete="username"
                  />
                </div>

                <div className="auth-field">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="auth-input"
                    autoComplete="current-password"
                  />
                </div>

                {message && (
                  <div
                    className={
                      message.includes("Please wait")
                        ? "auth-info"
                        : "auth-error"
                    }
                  >
                    {message}
                  </div>
                )}

                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <p className="auth-footer-text">
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
