import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "./api";
import heartImage from "./assets/new-auth-image.png";
import "./App.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setMessage("Username and password are required.");
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccessMessage("");

    try {
      const response = await API.post("/users/register/", formData);

      setSuccessMessage(response.data?.message || "Account created successfully.");
      setFormData({
        username: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Register error:", error);
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
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">
                Sign up to start uploading ECG files and tracking your analysis results.
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>

                <div className="auth-field">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>

                {message && <div className="auth-error">{message}</div>}
                {successMessage && <div className="auth-success">{successMessage}</div>}

                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? "Creating..." : "Sign Up"}
                </button>
              </form>

              <p className="auth-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
