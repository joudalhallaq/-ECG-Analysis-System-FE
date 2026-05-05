import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "./api";
import "./App.css";

function Dashboard() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");

  const [records, setRecords] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingAnalyzeId, setLoadingAnalyzeId] = useState(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoadingRecords(true);

    try {
      const response = await API.get(`/ecg/records/?user_id=${userId}`);

      if (Array.isArray(response.data)) {
        setRecords(response.data);
      } else if (Array.isArray(response.data.records)) {
        setRecords(response.data.records);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Fetch records error:", error);
      setMessage("Could not load ECG records.");
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setMessage("Please choose an ECG CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("ecg_file", selectedFile);
    try {
      await API.post("/ecg/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedFile(null);
      setMessage("ECG file uploaded successfully.");
      await fetchRecords();
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleAnalyze = async (recordId) => {
    setLoadingAnalyzeId(recordId);
    setMessage("");

    try {
      await API.post("/ecg/analyze/", {
        record_id: recordId,
      });

      setMessage("ECG analyzed successfully.");
      await fetchRecords();
    } catch (error) {
      console.error("Analyze error:", error);
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Analysis failed. Please try again."
      );
    } finally {
      setLoadingAnalyzeId(null);
    }
  };

  const handleDelete = async (recordId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/ecg/delete/${recordId}/`);
      setMessage("Record deleted successfully.");
      await fetchRecords();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Delete failed. Please try again."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div>
          <h2>ECG Analysis System</h2>
          <p>Welcome, {username || "User"}</p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <main className="dashboard-container">
        <section className="upload-card">
          <h3>Upload ECG File</h3>
          <p>Upload a CSV file to analyze the ECG condition.</p>

          <form onSubmit={handleUpload} className="upload-form">
            <input type="file" accept=".csv" onChange={handleFileChange} />

            <button type="submit" disabled={loadingUpload}>
              {loadingUpload ? "Uploading..." : "Upload"}
            </button>
          </form>

          {message && <p className="dashboard-message">{message}</p>}
        </section>

        <section className="records-card">
          <h3>Your ECG Records</h3>

          {loadingRecords ? (
            <p className="empty-text">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="empty-text">No ECG records uploaded yet.</p>
          ) : (
            <div className="records-table-wrapper">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Uploaded At</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{record.file_name || record.file || "ECG file"}</td>
                      <td>
                        {record.uploaded_at
                          ? new Date(record.uploaded_at).toLocaleString()
                          : "N/A"}
                      </td>
                      <td>{record.predicted_condition || "Not analyzed"}</td>
                      <td>
                        {record.confidence
                          ? `${Math.round(Number(record.confidence) * 100)}%`
                          : "N/A"}
                      </td>
                      <td className="action-buttons">
                        <button
                          onClick={() => handleAnalyze(record.id)}
                          disabled={loadingAnalyzeId === record.id}
                        >
                          {loadingAnalyzeId === record.id
                            ? "Analyzing..."
                            : "Analyze"}
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
