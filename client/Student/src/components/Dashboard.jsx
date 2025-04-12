import { useState, useEffect, useRef } from 'react';
import image from "../assets/Untitled.png";
import { useOnline } from "../hooks/useOnline";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const online = useOnline();
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [thumbnailGenerating, setThumbnailGenerating] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedVideoTranscriptText, setSelectedVideoTranscriptText] = useState('');
  const [teacherData, setTeacherData] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [videoTitle, setVideoTitle] = useState(''); // New state for video title
  const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen state
  const [activeQuiz, setActiveQuiz] = useState(null); // State to track active quiz
  const [wrongAnswer, setWrongAnswer] = useState(null); // Track wrong answer selection
  const [showExplanation, setShowExplanation] = useState(false); // Show explanation after wrong answer
  const videoPlayerContainerRef = useRef(null); // Reference to the container
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("tracker-email-teacher");
    if (!email) {
      navigate("/");
      return;
    }
    
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
  }, [navigate]);

  useEffect(() => {
    const fetchUploadedVideos = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/upload/get-all-videos");
        setRecentUploads(response.data.videos || []);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchUploadedVideos();
  }, []);

  // Generate thumbnail from video when video is loaded
  useEffect(() => {
    if (!videoFile) {
      setVideoPreview(null);
      setThumbnail(null);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setThumbnailGenerating(true);
    const url = URL.createObjectURL(videoFile);
    setVideoPreview(url);

    const handleMetadataLoaded = () => {
      // Wait a bit to make sure video is properly loaded
      setTimeout(() => {
        video.currentTime = Math.min(1, video.duration / 4); // Set to 1 second or 1/4 of duration (whichever is smaller)
      }, 150);
    };

    const handleSeeked = () => {
      try {
        generateThumbnail();
      } catch (error) {
        console.error("Error generating thumbnail:", error);
      } finally {
        setThumbnailGenerating(false);
      }
    };

    video.addEventListener('loadedmetadata', handleMetadataLoaded);
    video.addEventListener('seeked', handleSeeked);
    video.src = url;
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleMetadataLoaded);
      video.removeEventListener('seeked', handleSeeked);
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = 
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement;
      
      setIsFullscreen(!!isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const generateThumbnail = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video has invalid dimensions");
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame on the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setThumbnail(blob);
        } else {
          console.error("Failed to generate thumbnail blob");
        }
      },
      'image/jpeg',
      0.8
    );
  };

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file is a video
      if (!file.type.startsWith('video/')) {
        alert("Please select a valid video file");
        return;
      }
      
      setVideoFile(file);
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !transcriptText.trim() || !videoTitle.trim()) {
      alert("Video file, title, and transcript text are all required");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("transcriptText", transcriptText);
    formData.append("videoTitle", videoTitle); // Add title to form data
    
    // Add thumbnail to form data if available
    if (thumbnail) {
      formData.append("thumbnail", thumbnail, `${videoFile.name.split('.')[0]}_thumbnail.jpg`);
    }
    
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
        setVideoPreview(null);
        setThumbnail(null);
        setTranscriptText('');
        setVideoTitle('');
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

  const deleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    setLoading(true);
    
    try {
      await axios.delete(`http://localhost:8000/api/upload/delete-video/${videoId}`);
      setRecentUploads(prev => prev.filter(video => video._id !== videoId));
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Error deleting video");
    } finally {
      setLoading(false);
    }
  };

  // Mock function to handle quiz answer selection
  const handleQuizAnswer = (answerId, isCorrect, explanation) => {
    if (isCorrect) {
      // Correct answer - dismiss quiz and continue video
      setActiveQuiz(null);
      if (videoRef.current) {
        videoRef.current.play();
      }
    } else {
      // Wrong answer - show explanation and don't count against user
      setWrongAnswer(answerId);
      setShowExplanation(true);
      
      // After a delay, dismiss the wrong answer indication but keep explanation visible
      setTimeout(() => {
        setWrongAnswer(null);
      }, 1500);
    }
  };

  // Mock function to dismiss explanation and continue
  const dismissExplanation = () => {
    setShowExplanation(false);
    setActiveQuiz(null);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Toggle fullscreen for the video container
  const toggleFullscreen = () => {
    const container = videoPlayerContainerRef.current;
    
    if (!container) return;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 w-full min-h-screen bg-black text-white">
      {/* Hidden video and canvas elements for thumbnail generation */}
      <div className="hidden">
        <video ref={videoRef} crossOrigin="anonymous" preload="metadata" playsInline muted />
        <canvas ref={canvasRef} />
      </div>

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
                    {thumbnailGenerating ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-white rounded-full mb-2" />
                        <p className="text-sm text-white">Generating thumbnail...</p>
                      </div>
                    ) : thumbnail ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={URL.createObjectURL(thumbnail)} 
                          alt="Video thumbnail" 
                          className="w-full max-h-24 object-contain mb-2 rounded"
                        />
                        <p className="text-sm text-white truncate max-w-full">{videoFile?.name}</p>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm md:text-base text-white text-center px-2 truncate max-w-full">
                          {videoFile ? videoFile.name : "Click to upload video"}
                        </p>
                      </>
                    )}
                  </div>
                  <input id="video" type="file" className="hidden" onChange={handleVideoChange} accept="video/*" name="video" />
                </label>
                
                {/* Video Title Input */}
                <div className="mt-4">
                  <h2 className="text-lg font-semibold mb-2">Video Title</h2>
                  <input
                    type="text"
                    className="w-full bg-black border-2 border-white rounded-lg p-3 text-white placeholder-gray-400"
                    placeholder="Enter video title... (Required)"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>
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
                disabled={loading || thumbnailGenerating || !videoFile || !transcriptText.trim() || !videoTitle.trim()}
              >
                {loading ? (
                  <div className="animate-spin inline-block size-5 border-[3px] border-current border-t-transparent text-black rounded-full mr-2" />
                ) : null}
                {loading ? "Uploading..." : "Upload Video & Transcript"}
              </button>
              <p className="text-sm text-gray-400 mt-2">
                Video file, title, and transcript text are all required for upload.
              </p>
            </div>
          </section>

          {/* Video Player Example (for demonstration purposes) */}
          <section className="w-full border border-white rounded-lg p-4">
            <h3 className="text-lg md:text-xl font-medium mb-4">Video Player Preview</h3>
            <div 
              ref={videoPlayerContainerRef} 
              className="relative w-full bg-black rounded overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {/* Video Player */}
              <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                <p className="text-gray-400">Video preview will appear here</p>
                
                {/* Fullscreen Button */}
                <button 
                  className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded"
                  onClick={toggleFullscreen}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isFullscreen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    )}
                  </svg>
                </button>
                
                {/* Quiz Overlay (With fullscreen compatibility) */}
                {activeQuiz && (
                  <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                      <h4 className="text-xl font-bold mb-4">{activeQuiz.question}</h4>
                      
                      <div className="space-y-3">
                        {activeQuiz.answers.map(answer => (
                          <button
                            key={answer.id}
                            className={`w-full text-left p-3 rounded-md transition-all ${
                              wrongAnswer === answer.id
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                            onClick={() => handleQuizAnswer(answer.id, answer.isCorrect, answer.explanation)}
                          >
                            {answer.text}
                          </button>
                        ))}
                      </div>
                      
                      {showExplanation && (
                        <div className="mt-4 p-4 bg-blue-900 rounded-md">
                          <h5 className="font-bold mb-2">Explanation:</h5>
                          <p>{activeQuiz.explanation}</p>
                          <button
                            className="mt-4 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition"
                            onClick={dismissExplanation}
                          >
                            Continue
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              This example shows how the quiz overlay would work when videos are played.
            </p>
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
                          <div className="flex justify-between items-center mb-2">
                            {/* Display video title if available */}
                            <h4 className="font-medium text-lg">{upload.videoTitle || upload.name}</h4>
                            <button 
                              className="text-red-500 hover:text-red-400 text-xs p-1"
                              onClick={() => deleteVideo(upload._id)}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
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
                          {upload.thumbnailUrl ? (
                            <div className="mt-2 md:w-32">
                              <img 
                                src={upload.thumbnailUrl} 
                                alt="Thumbnail" 
                                className="w-full h-auto rounded shadow-md"
                              />
                            </div>
                          ) : (
                            <div className="mt-2 md:w-32 flex items-center justify-center bg-gray-800 rounded h-20">
                              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
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

      {/* This section would be used for actual video playback with quizzes */}
      {/* Video Player Component for watching videos (separate from your dashboard) */}
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" style={{ display: 'none' }}> {/* Hidden by default */}
        <div className="bg-black rounded-lg overflow-hidden w-full max-w-4xl">
          <div className="relative" style={{ aspectRatio: '16/9' }}>
            {/* This is where your actual video player would be rendered */}
            <div className="absolute inset-0 bg-black">
              {/* Video player goes here */}
            </div>
            
            {/* Quiz overlay - this would be shown when video pauses for quiz */}
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10 p-4">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h4 className="text-xl font-bold mb-4">Sample Quiz Question</h4>
                
                <div className="space-y-3">
                  {/* Quiz options would be mapped here */}
                  <button className="w-full text-left p-3 rounded-md bg-gray-700 hover:bg-gray-600">
                    Option 1
                  </button>
                  <button className="w-full text-left p-3 rounded-md bg-gray-700 hover:bg-gray-600">
                    Option 2
                  </button>
                  <button className="w-full text-left p-3 rounded-md bg-red-600 text-white">
                    Option 3 (Wrong answer example)
                  </button>
                  <button className="w-full text-left p-3 rounded-md bg-gray-700 hover:bg-gray-600">
                    Option 4
                  </button>
                </div>
                
                {/* Explanation section - shown after wrong answer */}
                <div className="mt-4 p-4 bg-blue-900 rounded-md">
                  <h5 className="font-bold mb-2">Explanation:</h5>
                  <p>This is where the explanation text would appear when a student selects a wrong answer. The explanation should help them understand why their answer was incorrect and guide them to the correct understanding.</p>
                  <button className="mt-4 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}