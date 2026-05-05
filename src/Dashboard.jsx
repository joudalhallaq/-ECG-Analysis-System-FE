import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
)

function Dashboard() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [records, setRecords] = useState([])
  const [ecgData, setEcgData] = useState([])
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const userId = localStorage.getItem('user_id')

  const fetchRecords = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/ecg/records/?user_id=${userId}`
      )
      setRecords(response.data.records)
    } catch (error) {
      console.log('Failed to load records')
    }
  }

  useEffect(() => {
    if (!userId) {
      navigate('/')
      return
    }

    fetchRecords()
  }, [userId, navigate])

  const readEcgFile = (selectedFile) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const text = event.target.result
      const values = text
        .split(/,|\n|\r/)
        .map((v) => parseFloat(v.trim()))
        .filter((v) => !isNaN(v))

      setEcgData(values)
    }

    reader.readAsText(selectedFile)
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!file) {
      setMessage('Please select a file')
      return
    }

    setLoading(true)
    setMessage('')
    setResult(null)

    readEcgFile(file)

    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('ecg_file', file)

    try {
      const uploadResponse = await axios.post(
        'http://127.0.0.1:8000/api/ecg/upload/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      const recordId = uploadResponse.data.record_id

      const analyzeResponse = await axios.post(
        'http://127.0.0.1:8000/api/ecg/analyze/',
        {
          record_id: recordId,
        }
      )

      setResult(analyzeResponse.data)
      setMessage('Upload and analysis successful ✅')
      fetchRecords()
    } catch (error) {
      setMessage('Process failed ❌')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recordId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/ecg/delete/${recordId}/`)
      setMessage('Record deleted successfully 🗑️')
      fetchRecords()
    } catch (error) {
      setMessage('Delete failed ❌')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    navigate('/')
  }

  const generatePDF = () => {
    if (!result) {
      setMessage('No result available to generate report')
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('ECG Analysis Report', 20, 20)

    doc.setFontSize(12)
    doc.text(`Patient/User: ${username}`, 20, 35)
    doc.text(`Condition: ${result.predicted_condition}`, 20, 50)
    doc.text(`Confidence: ${result.confidence}`, 20, 65)

    doc.text('Explanation:', 20, 85)
    doc.text(result.short_explanation || 'No explanation available.', 20, 95, {
      maxWidth: 170,
    })

    doc.text('Detailed Explanation:', 20, 120)
    doc.text(
      result.detailed_explanation || 'No detailed explanation available.',
      20,
      130,
      { maxWidth: 170 }
    )

    doc.text('Disclaimer:', 20, 165)
    doc.text(
      'This system supports medical understanding only and does not replace professional medical diagnosis. Please consult a doctor.',
      20,
      175,
      { maxWidth: 170 }
    )

    doc.save('ecg_analysis_report.pdf')
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="medical-header text-center mb-4">
        <h2>
          <span className="heart">❤️</span> ECG Analysis System
        </h2>
        <p className="mb-0">A supportive heart monitoring tool for patients</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="heart-title">Heart Health Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {username}</p>
        </div>

        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="card p-4 mt-4 shadow-lg border-0 rounded-4" style={{ maxWidth: '950px' }}>
        <h4 className="mb-3 fw-bold">Upload ECG File</h4>

        <form onSubmit={handleUpload}>
          <input
            type="file"
            className="form-control mb-3"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button className="btn btn-heart w-100 mt-2" disabled={loading}>
            {loading ? 'Analyzing...' : '❤️ Upload & Analyze ECG'}
          </button>
        </form>

        {loading && (
          <div className="mt-3 text-center">
            <div className="loader"></div>
            <p className="mt-2">Analyzing ECG...</p>
          </div>
        )}

        {message && <div className="alert alert-info mt-3">{message}</div>}

        {result && (
          <div className="card mt-4 p-4 result-card shadow rounded-4">
            <h5 className="fw-bold mb-3">Latest Analysis Result</h5>

            <p className="fs-5">
              <strong>Condition:</strong>{' '}
              <span className="text-success">{result.predicted_condition}</span>
            </p>

            <p className="fs-5">
              <strong>Confidence:</strong>{' '}
              <span className="text-primary">{result.confidence}</span>
            </p>

            <p>
              <strong>Explanation:</strong> {result.short_explanation}
            </p>

            <p>
              <strong>Detailed Explanation:</strong>{' '}
              {result.detailed_explanation}
            </p>

            <div className="alert warning-box mt-3">
              <strong>Disclaimer:</strong> This system supports medical
              understanding only and does not replace professional medical
              diagnosis. Please consult a doctor.
            </div>

            <button className="btn btn-primary mt-3 w-100" onClick={generatePDF}>
              📄 Download PDF Report
            </button>

            {ecgData.length > 0 && (
              <div className="card mt-4 p-4 bg-white shadow border-0 rounded-4">
                <h5 className="fw-bold">ECG Signal Visualization</h5>

                <Line
                  data={{
                    labels: ecgData.map((_, index) => index + 1),
                    datasets: [
                      {
                        label: 'ECG Signal',
                        data: ecgData,
                        borderColor: 'blue',
                        backgroundColor: 'blue',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 2,
                      },
                      {
                        label: 'Detected Peaks',
                        data: ecgData.map((v) => (v > 0.25 ? v : null)),
                        borderColor: 'red',
                        backgroundColor: 'red',
                        showLine: false,
                        pointRadius: 6,
                      },
                      {
                        label: 'Baseline',
                        data: ecgData.map(() => 0),
                        borderColor: 'green',
                        borderDash: [5, 5],
                        pointRadius: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: true },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Sample / Time' },
                      },
                      y: {
                        title: { display: true, text: 'Amplitude' },
                      },
                    },
                  }}
                />

                <div className="alert alert-secondary mt-3">
                  <strong>Graph Meaning:</strong>
                  <br />
                  <span style={{ color: 'blue' }}>Blue line</span>: ECG signal
                  over time.
                  <br />
                  <span style={{ color: 'red' }}>Red points</span>: detected
                  peaks.
                  <br />
                  <span style={{ color: 'green' }}>Green dashed line</span>:
                  baseline/reference level.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-4 mt-4 shadow-lg border-0 rounded-4" style={{ maxWidth: '950px' }}>
        <h4 className="mb-3 fw-bold">Previous ECG Records</h4>

        {records.length === 0 ? (
          <p className="text-muted">No records found.</p>
        ) : (
          <ul className="list-group">
            {records.map((record) => (
              <li key={record.id} className="list-group-item">
                <strong>ID:</strong> {record.id} <br />
                <strong>File:</strong> {record.file_name} <br />
                <strong>Uploaded:</strong> {record.uploaded_at} <br />

                {record.predicted_condition && (
                  <>
                    <strong>Condition:</strong>{' '}
                    <span className="text-success">
                      {record.predicted_condition}
                    </span>{' '}
                    <br />
                    <strong>Confidence:</strong>{' '}
                    <span className="text-primary">{record.confidence}</span>
                    <br />
                  </>
                )}

                <button
                  className="btn btn-outline-danger btn-sm mt-2"
                  onClick={() => handleDelete(record.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Dashboard