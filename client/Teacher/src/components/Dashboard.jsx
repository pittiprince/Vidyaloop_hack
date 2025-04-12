import { useState, useEffect } from 'react';
import image from "../assets/Untitled.png";
import { useOnline } from "./hooks/useOnline";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const online = useOnline();
  const [videoFile, setVideoFile] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedVideoTranscriptText, setSelectedVideoTranscriptText] = useState('');
  const [teacherData, setTeacherData] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("tracker-email-teacher");
    const fetchTeacherData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/teacher-auth/user", {
          headers: { email },
        });
        setTeacherData(response.data[0]);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      } finally {
        setTeacherLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  useEffect(() => {
    const fetchUploadedVideos = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/upload/get-all-videos");
        setRecentUploads(response.data.videos);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchUploadedVideos();
  }, []);

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !transcriptText.trim()) {
      alert("Both video file and transcript text are required");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("transcriptText", transcriptText);
    
    setLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:8000/api/upload/upload-video", 
        formData, 
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data && data.video) {
        setRecentUploads((prev) => [data.video, ...prev]);
        setVideoFile(null);
        setTranscriptText('');
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      if (error.response && error.response.data) {
        alert(error.response.data.message);
      } else {
        alert("Error uploading video and transcript");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTranscript = async (videoId) => {
    if (!selectedVideoTranscriptText.trim()) {
      alert("Transcript text is required");
      return;
    }

    setLoading(true);
    
    try {
      const { data } = await axios.post(
        `http://localhost:8000/api/upload/update-transcript/${videoId}`,
        { transcriptText: selectedVideoTranscriptText },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (data && data.video) {
        setRecentUploads(prev => 
          prev.map(video => video._id === videoId ? data.video : video)
        );
        setSelectedVideoTranscriptText('');
        setSelectedVideoId(null);
      }
    } catch (error) {
      console.error("Error updating transcript:", error);
      if (error.response && error.response.data) {
        alert(error.response.data.message);
      } else {
        alert("Error updating transcript");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 w-full min-h-screen bg-black text-white">
      {/* Main Content */}
      <div className="lg:col-span-9 p-4 md:p-6">
        <div className="flex flex-col space-y-8">
          {/* Upload Section */}
          <section className="w-full bg-black border border-white rounded-lg p-6">
            <h1 className="text-xl md:text-2xl font-bold mb-6">Upload Video & Transcript</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Video Upload */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Video File</h2>
                <label htmlFor="video" className="w-full flex flex-col items-center justify-center border-2 border-dashed border-white rounded-lg cursor-pointer bg-black hover:bg-gray-900 transition duration-300 h-40">
                  <div className="flex flex-col items-center justify-center p-5">
                    <svg className="w-8 h-8 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm md:text-base text-white text-center px-2 truncate max-w-full">
                      {videoFile ? videoFile.name : "Click to upload video"}
                    </p>
                  </div>
                  <input id="video" type="file" className="hidden" onChange={handleVideoChange} accept="video/*" name="video" />
                </label>
              </div>

              {/* Transcript Text Input */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Transcript Text</h2>
                <textarea
                  className="w-full h-40 bg-black border-2 border-white rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                  placeholder="Type or paste transcript text here... (Required)"
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6">
              <button 
                className="px-6 py-2 bg-white text-black rounded-md text-sm md:text-base hover:bg-gray-200 font-medium transition duration-300 flex items-center justify-center min-w-36 disabled:opacity-50" 
                onClick={handleUpload} 
                disabled={loading || !videoFile || !transcriptText.trim()}
              >
                {loading ? (
                  <div className="animate-spin inline-block size-5 border-[3px] border-current border-t-transparent text-black rounded-full mr-2" />
                ) : null}
                {loading ? "Uploading..." : "Upload Video & Transcript"}
              </button>
              <p className="text-sm text-gray-400 mt-2">
                Both video file and transcript text are required for upload.
              </p>
            </div>
          </section>

          {/* Recent Uploads Section */}
          <section className="w-full">
            <div className="bg-black border border-white rounded-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-medium mb-4">Recent Uploads</h3>
              {recentUploads.length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {recentUploads.map((upload, index) => (
                    <div key={index} className="text-white text-sm md:text-base border-b border-gray-700 pb-4">
                      <div className="flex flex-col md:flex-row md:justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-2">{upload.name}</h4>
                          <p className="mb-1"><strong>Size:</strong> {Math.round(upload.size / 1024)} KB</p>
                          <p className="mb-1"><strong>Type:</strong> {upload.fileType}</p>
                          <p className="mb-1"><strong>Uploaded:</strong> {new Date(upload.uploadDate).toLocaleDateString()}</p>
                          
                          <div className="mt-3 p-3 bg-gray-900 rounded-md">
                            <div className="flex justify-between items-start">
                              <p className="font-medium">Transcript</p>
                              <button 
                                className="text-blue-400 hover:text-blue-300 text-xs"
                                onClick={() => {
                                  setSelectedVideoId(upload._id);
                                  setSelectedVideoTranscriptText(upload.transcriptText || '');
                                }}
                              >
                                Edit
                              </button>
                            </div>
                            <div className="mt-2 max-h-28 overflow-y-auto">
                              <p className="text-sm whitespace-pre-wrap">{upload.transcriptText}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end gap-2">
                          <a 
                            href={upload.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-block px-4 py-2 bg-white text-black rounded text-sm hover:bg-gray-200 transition duration-300"
                          >
                            View Video
                          </a>
                          {upload.thumbnailUrl && (
                            <div className="mt-2 md:w-32">
                              <img 
                                src={upload.thumbnailUrl} 
                                alt="Thumbnail" 
                                className="w-full h-auto rounded shadow-md"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white text-sm md:text-base">No recent uploads found.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Sidebar Profile */}
      <div className="lg:col-span-3 p-4">
        <div className="w-full max-w-sm mx-auto">
          <div className="rounded-lg border border-white bg-black text-white px-4 pt-6 pb-6 shadow-lg">
            <div className="relative mx-auto w-24 md:w-32 rounded-full">
              <span className={`absolute right-0 m-1 h-3 w-3 rounded-full ${online ? "bg-green-500" : "bg-gray-500"} ring-2 ring-white ring-offset-1 ring-offset-black`}></span>
              <img className="mx-auto h-auto w-full rounded-full" src={image} alt="Profile" />
            </div>
            
            {teacherLoading ? (
              <div className="flex justify-center my-4">
                <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-white rounded-full" />
              </div>
            ) : (
              <>
                <h1 className="my-2 text-center text-xl font-bold">{teacherData?.name}</h1>
                <h3 className="font-medium text-center text-white text-sm md:text-base">{teacherData?.institute}</h3>
                <p className="text-center text-xs md:text-sm text-gray-300 mt-1">
                  {teacherData?.exprience}
                </p>
              </>
            )}
            
            <ul className="mt-4 divide-y divide-gray-700 rounded bg-black py-2 px-3 text-white shadow-sm border border-white">
              <li className="flex items-center py-2 text-sm">
                <span>Status</span>
                <span className="ml-auto">
                  <span className={`rounded-full py-1 px-2 text-xs font-medium ${online ? "bg-green-500 text-black" : "bg-gray-800 text-white border border-white"}`}>
                    {online ? "Online" : "Offline"}
                  </span>
                </span>
              </li>
              <li className="flex items-center py-2 text-sm">
                <span>Email</span>
                <span className="ml-auto truncate max-w-32">
                  {teacherLoading ? (
                    <div className="animate-spin inline-block size-4 border-[2px] border-current border-t-transparent text-white rounded-full" />
                  ) : teacherData?.email}
                </span>
              </li>
              <li className="flex items-center py-2 text-sm">
                <span>Age</span>
                <span className="ml-auto">
                  {teacherLoading ? (
                    <div className="animate-spin inline-block size-4 border-[2px] border-current border-t-transparent text-white rounded-full" />
                  ) : teacherData?.age}
                </span>
              </li>
            </ul>
            
            <button 
              className="px-4 py-2 my-3 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 w-full transition duration-300"
              onClick={() => { localStorage.clear(); navigate("/") }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Edit Transcript Modal */}
      {selectedVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Transcript</h3>
            
            <textarea
              className="w-full h-64 bg-black border-2 border-white rounded-lg p-3 text-white placeholder-gray-400 resize-none mb-4"
              placeholder="Edit transcript text here..."
              value={selectedVideoTranscriptText}
              onChange={(e) => setSelectedVideoTranscriptText(e.target.value)}
            />
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-transparent text-white rounded-md text-sm border border-white hover:bg-gray-900 transition duration-300" 
                onClick={() => {
                  setSelectedVideoId(null);
                  setSelectedVideoTranscriptText('');
                }}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-white text-black rounded-md text-sm hover:bg-gray-200 font-medium transition duration-300 flex items-center justify-center disabled:opacity-50" 
                onClick={() => handleUpdateTranscript(selectedVideoId)} 
                disabled={loading || !selectedVideoTranscriptText.trim()}
              >
                {loading ? (
                  <div className="animate-spin inline-block size-5 border-[3px] border-current border-t-transparent text-black rounded-full mr-2" />
                ) : null}
                {loading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}