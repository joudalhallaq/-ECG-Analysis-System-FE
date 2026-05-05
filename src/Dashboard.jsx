import { useEffect, useMemo, useState } from "react";
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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deviceMode, setDeviceMode] = useState(false);
  const [deviceText, setDeviceText] = useState("");

  const disclaimer =
    "This system is designed to support ECG understanding and education. It does not replace professional medical diagnosis. Please consult a qualified doctor for medical decisions.";

  useEffect(() => {
    if (!userId || userId === "undefined" || userId === "null") {
      navigate("/login");
      return;
    }

    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedRecords = useMemo(() => {
    return Array.isArray(records) ? records : [];
  }, [records]);

  const fetchRecords = async () => {
    if (!userId) return;

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
      setMessage("Could not load ECG records. Please try again.");
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file || null);
    setMessage("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!userId || userId === "undefined" || userId === "null") {
      setMessage("User session is invalid. Please logout and login again.");
      return;
    }

    if (!selectedFile) {
      setMessage("Please choose an ECG file first.");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("ecg_file", selectedFile);

    setLoadingUpload(true);
    setMessage("");

    try {
      const response = await API.post("/ecg/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedFile(null);

      const fileInput = document.getElementById("ecg-file-input");
      if (fileInput) fileInput.value = "";

      setMessage(response.data?.message || "ECG file uploaded successfully.");
      await fetchRecords();
    } catch (error) {
      console.error("Upload error:", error);

      if (error.response?.data?.error?.toLowerCase().includes("user not found")) {
        setMessage("Session issue detected. Please logout and login again.");
      } else {
        setMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Upload failed. Please check the file and try again."
        );
      }
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleDeviceSubmit = async () => {
    if (!userId || userId === "undefined" || userId === "null") {
      setMessage("User session is invalid. Please logout and login again.");
      return;
    }

    if (!deviceText.trim()) {
      setMessage("Please paste ECG data from the external device first.");
      return;
    }

    setLoadingUpload(true);
    setMessage("");

    try {
      const response = await API.post("/ecg/device-submit/", {
        user_id: userId,
        ecg_data: deviceText,
        source_type: "external_device",
      });

      setDeviceText("");
      setMessage(response.data?.message || "ECG data received successfully.");
      await fetchRecords();
    } catch (error) {
      console.error("Device submit error:", error);

      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "External ECG submission is not available yet on the backend."
      );
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleAnalyze = async (recordId) => {
    setLoadingAnalyzeId(recordId);
    setMessage("");
    setSelectedRecord(null);

    try {
      const response = await API.post("/ecg/analyze/", {
        record_id: recordId,
      });

      console.log("Analyze response:", response.data);

      setMessage(response.data?.message || "ECG analyzed successfully.");

      const analyzedRecord = {
        id: response.data?.record_id || recordId,
        predicted_condition: response.data?.predicted_condition || "Unknown",
        confidence: response.data?.confidence,
        short_explanation:
          response.data?.short_explanation ||
          "The ECG was analyzed by the AI model and a predicted condition was generated.",
        detailed_explanation:
          response.data?.detailed_explanation ||
          response.data?.short_explanation ||
          "A detailed explanation is not available for this result yet.",
        xai_explanation:
          response.data?.xai_explanation ||
          "Advanced explainable AI highlighting is not available for this analysis yet.",
        signal_values:
          response.data?.signal_values ||
          response.data?.signal ||
          response.data?.ecg_signal ||
          response.data?.values ||
          [],
      };

      setSelectedRecord(analyzedRecord);
      setShowDetails(true);
      await fetchRecords();
    } catch (error) {
      console.error("Analyze error:", error);

      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Analysis failed. The uploaded file may not be in a supported ECG format."
      );
    } finally {
      setLoadingAnalyzeId(null);
    }
  };

  const handleViewResult = async (record) => {
    setMessage("");
    setShowDetails(false);

    try {
      const response = await API.get(`/ecg/result/${record.id}/`);

      console.log("Result response:", response.data);

      setSelectedRecord({
        ...record,
        ...response.data,
        id: response.data?.id || response.data?.record_id || record.id,
        short_explanation:
          response.data?.short_explanation ||
          record.short_explanation ||
          "No short explanation is available yet.",
        detailed_explanation:
          response.data?.detailed_explanation ||
          record.detailed_explanation ||
          "No detailed explanation is available yet.",
        xai_explanation:
          response.data?.xai_explanation ||
          record.xai_explanation ||
          "Advanced explainable AI highlighting is not available for this analysis yet.",
        signal_values:
          response.data?.signal_values ||
          response.data?.signal ||
          response.data?.ecg_signal ||
          response.data?.values ||
          record.signal_values ||
          [],
      });
    } catch (error) {
      console.error("View result error:", error);

      setSelectedRecord({
        ...record,
        id: record.id,
        short_explanation:
          record.short_explanation || "No short explanation is available yet.",
        detailed_explanation:
          record.detailed_explanation || "No detailed explanation is available yet.",
        xai_explanation:
          record.xai_explanation ||
          "Advanced explainable AI highlighting is not available for this analysis yet.",
        signal_values: record.signal_values || [],
      });
    }
  };

  const handleDelete = async (recordId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this ECG record?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/ecg/delete/${recordId}/`);

      setMessage("Record deleted successfully.");
      setSelectedRecord(null);
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

  const handleDownloadReport = async () => {
    if (!selectedRecord?.id) {
      setMessage("No analysis result available for report generation.");
      return;
    }

    try {
      const response = await API.get(`/ecg/report/${selectedRecord.id}/`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(blob);

      const fileLink = document.createElement("a");
      fileLink.href = fileURL;
      fileLink.setAttribute("download", `ecg_report_${selectedRecord.id}.pdf`);

      document.body.appendChild(fileLink);
      fileLink.click();

      fileLink.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("PDF download error:", error);
      setMessage("PDF report generation failed. Please try again.");
    }
  };

  const handleShareReport = async () => {
    if (!selectedRecord) {
      setMessage("No analysis result available to share.");
      return;
    }

    const shareText = `ECG Analysis Result:
Predicted Condition: ${selectedRecord.predicted_condition || "Not available"}
Confidence: ${
      selectedRecord.confidence !== undefined && selectedRecord.confidence !== null
        ? `${Math.round(Number(selectedRecord.confidence) * 100)}%`
        : "Not available"
    }

${selectedRecord.short_explanation || ""}

Disclaimer: ${disclaimer}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "ECG Analysis Report",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setMessage("Report summary copied. You can paste it and send it to your doctor.");
      }
    } catch (error) {
      setMessage("Share failed. You can download the report instead.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    navigate("/login");
  };

 const renderMiniSignal = (values) => {
  const rawSignal = Array.isArray(values)
    ? values
        .map((v) => Number(v))
        .filter((v) => !Number.isNaN(v) && Number.isFinite(v))
    : [];

  if (rawSignal.length < 2) {
    return (
      <div className="ecg-placeholder">
        ECG signal visualization is not available for this record yet.
      </div>
    );
  }

  // نقلل عدد النقاط إذا كانت كثيرة عشان الرسم يكون أنظف وأسرع
  const maxPoints = 180;
  const step = Math.max(1, Math.ceil(rawSignal.length / maxPoints));
  const signal = rawSignal.filter((_, index) => index % step === 0);

  const width = 1000;
  const height = 320;
  const padding = 24;

  const min = Math.min(...signal);
  const max = Math.max(...signal);
  const range = max - min || 1;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = signal
    .map((value, index) => {
      const x =
        padding + (index / Math.max(signal.length - 1, 1)) * chartWidth;
      const y =
        height -
        padding -
        ((value - min) / range) * chartHeight;

      return `${x},${y}`;
    })
    .join(" ");

  const horizontalLines = 5;
  const verticalLines = 10;

  return (
    <div className="ecg-chart-wrapper">
      <svg
        className="ecg-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* background */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx="18"
          className="ecg-bg"
        />

        {/* horizontal grid */}
        {Array.from({ length: horizontalLines + 1 }).map((_, i) => {
          const y = padding + (i / horizontalLines) * chartHeight;
          return (
            <line
              key={`h-${i}`}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              className="ecg-grid-line"
            />
          );
        })}

        {/* vertical grid */}
        {Array.from({ length: verticalLines + 1 }).map((_, i) => {
          const x = padding + (i / verticalLines) * chartWidth;
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1={padding}
              x2={x}
              y2={height - padding}
              className="ecg-grid-line"
            />
          );
        })}

        {/* middle line */}
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          className="ecg-mid-line"
        />

        {/* ECG line */}
        <polyline
          points={points}
          className="ecg-polyline"
        />
      </svg>
    </div>
  );
};
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const range = max - min || 1;

    const points = signal
      .map((value, index) => {
        const x = (index / Math.max(signal.length - 1, 1)) * 100;
        const normalized = (value - min) / range;
        const y = 85 - normalized * 70;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="ecg-chart-wrap">
        <svg className="ecg-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={points} fill="none" strokeWidth="2.5" />
        </svg>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="brand-box">
          <div className="brand-icon">♥</div>

          <div>
            <h2>ECG Analysis System</h2>
            <p>AI-powered ECG analysis and patient-friendly reports</p>
          </div>
        </div>

        <div className="nav-actions">
          <div className="welcome-chip">
            <span>Welcome back</span>
            <strong>{username || "User"}</strong>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-container">
        <section className="disclaimer-card">
          <strong>Medical Disclaimer:</strong> {disclaimer}
        </section>

        <section className="upload-card">
          <div className="section-header">
            <div>
              <h3>ECG Submission</h3>
              <p>Upload an ECG file or submit ECG data from an external device.</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setDeviceMode(!deviceMode)}
            >
              {deviceMode ? "Use File Upload" : "Use External Device"}
            </button>
          </div>

          {!deviceMode ? (
            <form onSubmit={handleUpload} className="upload-form">
              <input
                id="ecg-file-input"
                type="file"
                onChange={handleFileChange}
              />

              <button type="submit" disabled={loadingUpload}>
                {loadingUpload ? "Uploading..." : "Upload"}
              </button>
            </form>
          ) : (
            <div className="device-box">
              <p className="helper-text">
                Paste ECG data sent from the associated device/application.
              </p>

              <textarea
                value={deviceText}
                onChange={(e) => setDeviceText(e.target.value)}
                placeholder="Paste ECG samples or transferred ECG data here..."
                rows="6"
              />

              <button onClick={handleDeviceSubmit} disabled={loadingUpload}>
                {loadingUpload ? "Submitting..." : "Submit Device ECG"}
              </button>
            </div>
          )}

          {message && <p className="dashboard-message">{message}</p>}
        </section>

        <section className="records-card">
          <h3>Your ECG Records</h3>

          {loadingRecords ? (
            <p className="empty-text">Loading records...</p>
          ) : normalizedRecords.length === 0 ? (
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
                  {normalizedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>

                      <td>
                        {record.file_name ||
                          record.file ||
                          record.ecg_file ||
                          "ECG file"}
                      </td>

                      <td>
                        {record.uploaded_at
                          ? new Date(record.uploaded_at).toLocaleString()
                          : "N/A"}
                      </td>

                      <td>{record.predicted_condition || "Not analyzed"}</td>

                      <td>
                        {record.confidence !== undefined &&
                        record.confidence !== null
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
                          className="secondary-button"
                          onClick={() => handleViewResult(record)}
                        >
                          View Result
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

        {selectedRecord && (
          <section className="result-card">
            <div className="section-header">
              <div>
                <h3>Analysis Result</h3>
                <p>Record ID: {selectedRecord.id || "N/A"}</p>
              </div>

              <div className="action-buttons">
                <button onClick={handleDownloadReport}>Download PDF Report</button>
                <button className="secondary-button" onClick={handleShareReport}>
                  Share / Export
                </button>
              </div>
            </div>

            <div className="result-grid">
              <div className="result-box">
                <span>Predicted Condition</span>
                <strong>
                  {selectedRecord.predicted_condition || "Not available"}
                </strong>
              </div>

              <div className="result-box">
                <span>Confidence</span>
                <strong>
                  {selectedRecord.confidence !== undefined &&
                  selectedRecord.confidence !== null
                    ? `${Math.round(Number(selectedRecord.confidence) * 100)}%`
                    : "Not available"}
                </strong>
              </div>
            </div>

            <div className="explanation-box">
              <h4>Short Explanation</h4>
              <p>
                {selectedRecord.short_explanation ||
                  "No short explanation is available yet."}
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails
                  ? "Hide Detailed Explanation"
                  : "Show Detailed Explanation"}
              </button>

              {showDetails && (
                <div className="details-panel">
                  <h4>Detailed Explanation</h4>
                  <p>
                    {selectedRecord.detailed_explanation ||
                      "No detailed explanation is available yet."}
                  </p>

                  <h4>Explainable Interpretation</h4>
                  <p>
                    {selectedRecord.xai_explanation ||
                      "Advanced explainable AI highlighting is not available yet."}
                  </p>
                </div>
              )}
            </div>

            <div className="signal-card">
              <h4>ECG Signal Visualization</h4>
              {renderMiniSignal(selectedRecord.signal_values)}
            </div>

            <div className="disclaimer-card">
              <strong>Medical Disclaimer:</strong> {disclaimer}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
