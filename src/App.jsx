import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./login.jsx";
import Register from "./Register.jsx";
import Dashboard from "./Dashboard.jsx";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
