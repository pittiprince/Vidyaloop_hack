import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { QuizModal } from './QuizModal';
import { PollModal } from './PollModal';
import { JustificationModal } from './JustificationModal';

function parseTimestamp(timestamp) {
  if (!timestamp) return 0;
  const parts = timestamp.split(':');
  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number);
    return minutes * 60 + seconds;
  }
  console.warn("Invalid timestamp format:", timestamp);
  return 0;
}

function Dashboard() {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [completedPolls, setCompletedPolls] = useState([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState({});
  const [allVideos, setAllVideos] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // New states for progress tracking
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalPolls, setTotalPolls] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  
  // New states for justification functionality
  const [showJustification, setShowJustification] = useState(false);
  const [justificationText, setJustificationText] = useState("");
  const [justificationLoading, setJustificationLoading] = useState(false);
  const [currentWrongAnswer, setCurrentWrongAnswer] = useState(null);
  const [isQuizJustification, setIsQuizJustification] = useState(true);

  useEffect(() => {
    const preventSelection = (e) => {
      e.preventDefault();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && playerRef.current) {
        playerRef.current.seekTo(0);
        setPlaying(true);
        setCurrentQuiz(null);
        setCurrentPoll(null);
      }
    };

    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchAllVideos = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/upload/get-all-videos");
      const data = await response.json();
      console.log("Fetched videos:", data);
      setAllVideos(data?.videos || []);
      
      // Set initial video data
      if (data?.videos && data.videos.length > 0) {
        const initialVideoData = data.videos[0]?.transcriptText;
        console.log("Initial video data:", initialVideoData);
        setCurrentData(initialVideoData || null);
      }
    } catch (error) {
      console.log("Error occurred fetching videos:", error);
    }
  }, []);

  useEffect(() => {
    fetchAllVideos();
  }, [fetchAllVideos]);

  // Update current data when selected video changes
  useEffect(() => {
    if (allVideos && allVideos.length > selectedVideoIndex) {
      try {
        let videoData = allVideos[selectedVideoIndex]?.transcriptText;
        
        // If transcriptText is a string, try to parse it as JSON
        if (typeof videoData === 'string') {
          try {
            videoData = JSON.parse(videoData);
            console.log("Parsed JSON data:", videoData);
          } catch (e) {
            console.error("Failed to parse transcriptText as JSON:", e);
          }
        }
        
        console.log("Setting current data for video index:", selectedVideoIndex, videoData);
        setCurrentData(videoData);
        
        // Reset quiz and poll states when changing videos
        setCompletedQuizzes([]);
        setCompletedPolls([]);
        setCurrentQuiz(null);
        setCurrentPoll(null);
        setWrongAttempts({});
        setUserScore(0);
        
        // Update total quizzes and polls for progress tracking
        if (videoData && videoData.quizzes && videoData.polls) {
          setTotalQuizzes(videoData.quizzes.length || 0);
          setTotalPolls(videoData.polls.length || 0);
        }
      } catch (error) {
        console.error("Error processing video data:", error);
      }
    }
  }, [selectedVideoIndex, allVideos]);

  // Update progress percentage when completed quizzes or polls change
  useEffect(() => {
    if (totalQuizzes + totalPolls > 0) {
      const completedCount = completedQuizzes.length + completedPolls.length;
      const totalCount = totalQuizzes + totalPolls;
      const percentage = Math.round((completedCount / totalCount) * 100);
      setProgressPercentage(percentage);
    } else {
      setProgressPercentage(0);
    }
  }, [completedQuizzes, completedPolls, totalQuizzes, totalPolls]);

  const handleProgress = ({ playedSeconds }) => {
    setCurrentTime(playedSeconds);
    
    if (!currentData) {
      console.log("No current data available");
      return;
    }
    
    if (!currentData.quizzes || !currentData.polls) {
      console.log("Missing quizzes or polls in current data:", currentData);
      return;
    }

    // Check for quizzes at the current timestamp
    const nextQuiz = currentData.quizzes.find(quiz => {
      if (!quiz.timestamp) {
        console.warn("Quiz missing timestamp:", quiz);
        return false;
      }
      
      const [start] = quiz.timestamp.split('-');
      const startTime = parseTimestamp(start);
      
      // Check if we're within 1 second of the quiz timestamp and it hasn't been completed
      const shouldTrigger = Math.abs(playedSeconds - startTime) < 1 && 
                            !completedQuizzes.includes(quiz.id) && 
                            !showJustification; // Don't trigger a new quiz if showing justification
      
      if (shouldTrigger) {
        console.log(`Triggering quiz at ${playedSeconds}s, timestamp: ${start}, quiz:`, quiz);
      }
      
      return shouldTrigger;
    });

    if (nextQuiz && !currentQuiz && !showJustification) {
      console.log("Setting current quiz:", nextQuiz);
      setPlaying(false);
      setCurrentQuiz(nextQuiz);
      setCurrentTimestamp(nextQuiz.timestamp);
    }

    // Check for polls at the current timestamp
    const nextPoll = currentData.polls.find(poll => {
      if (!poll.timestampRef) {
        console.warn("Poll missing timestampRef:", poll);
        return false;
      }
      
      const timestamp = poll.timestampRef.split(' ')[0];
      const [start] = timestamp.split('-');
      const startTime = parseTimestamp(start);
      
      // Check if we're within 1 second of the poll timestamp and it hasn't been completed
      const shouldTrigger = Math.abs(playedSeconds - startTime) < 1 && 
                            !completedPolls.includes(poll.id) && 
                            !showJustification; // Don't trigger a new poll if showing justification
      
      if (shouldTrigger) {
        console.log(`Triggering poll at ${playedSeconds}s, timestamp: ${start}, poll:`, poll);
      }
      
      return shouldTrigger;
    });

    if (nextPoll && !currentPoll && !showJustification) {
      console.log("Setting current poll:", nextPoll);
      setPlaying(false);
      setCurrentPoll(nextPoll);
    }
  };

  // Function to fetch justification from ChatGPT API
  const fetchJustificationFromChatGPT = async (question, wrongAnswer, correctAnswer, isQuiz) => {
    setJustificationLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/chatgpt/justification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
          wrongAnswer: wrongAnswer,
          correctAnswer: correctAnswer,
          isQuiz: isQuiz
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch justification");
      }

      const data = await response.json();
      return data.justification || "The correct answer is " + correctAnswer + ". Your answer was not correct.";
    } catch (error) {
      console.error("Error fetching justification:", error);
      return "We couldn't generate a specific explanation right now, but the correct answer is " + correctAnswer + ".";
    } finally {
      setJustificationLoading(false);
    }
  };

  const handleQuizAnswer = async (correct, selectedAnswer) => {
    if (currentQuiz && currentTimestamp) {
      if (correct) {
        console.log("Correct answer for quiz:", currentQuiz.id);
        setCompletedQuizzes([...completedQuizzes, currentQuiz.id]);
        setCurrentQuiz(null);
        setCurrentTimestamp(null);
        setPlaying(true);
        
        // Increase user score for correct answers
        setUserScore(prevScore => prevScore + 10);
        
        const newWrongAttempts = { ...wrongAttempts };
        delete newWrongAttempts[currentQuiz.id];
        setWrongAttempts(newWrongAttempts);
      } else {
        console.log("Incorrect answer for quiz:", currentQuiz.id, "Selected:", selectedAnswer);
        
        // Store the wrong answer info
        setCurrentWrongAnswer(selectedAnswer);
        setIsQuizJustification(true);
        
        // Get justification from ChatGPT
        const justification = await fetchJustificationFromChatGPT(
          currentQuiz.question,
          selectedAnswer,
          currentQuiz.answer,
          true
        );
        
        setJustificationText(justification);
        setShowJustification(true);
        
        const attempts = (wrongAttempts[currentQuiz.id] || 0) + 1;
        setWrongAttempts({ ...wrongAttempts, [currentQuiz.id]: attempts });
        setCurrentQuiz(null);
        setPlaying(false); // Keep paused while showing justification
      }
    }
  };

  const handlePollVote = async (selectedOption) => {
    if (currentPoll) {
      console.log("Poll voted:", currentPoll.id, "Selected:", selectedOption);
      
      // For polls, we'll assume there's a recommended answer to provide feedback on
      if (currentPoll.recommendedAnswer && selectedOption !== currentPoll.recommendedAnswer) {
        // Store the wrong answer info
        setCurrentWrongAnswer(selectedOption);
        setIsQuizJustification(false);
        
        // Get justification from ChatGPT
        const justification = await fetchJustificationFromChatGPT(
          currentPoll.question,
          selectedOption,
          currentPoll.recommendedAnswer,
          false
        );
        
        setJustificationText(justification);
        setShowJustification(true);
        setPlaying(false); // Keep paused while showing justification
      } else {
        // If correct or no recommended answer, just complete it
        setCompletedPolls([...completedPolls, currentPoll.id]);
        setPlaying(true);
        
        // Increase user score for correct poll answers (but less than quizzes)
        if (currentPoll.recommendedAnswer) {
          setUserScore(prevScore => prevScore + 5);
        } else {
          // Small participation score if no recommended answer
          setUserScore(prevScore => prevScore + 2);
        }
      }
      
      setCurrentPoll(null);
    }
  };

  const handleJustificationClose = () => {
    console.log("Justification closed");
    setShowJustification(false);
    
    // Resume playback or seek as needed based on wrong attempts
    if (currentTimestamp) {
      const quizId = currentQuiz?.id || completedQuizzes[completedQuizzes.length - 1];
      const attempts = wrongAttempts[quizId] || 0;
      
      if (attempts === 1) {
        console.log("First wrong attempt, restarting video");
        if (playerRef.current) {
          playerRef.current.seekTo(0);
        }
      } else {
        console.log("Multiple wrong attempts, seeking to quiz point");
        const [start] = currentTimestamp.split('-');
        const startTime = parseTimestamp(start);
        if (playerRef.current) {
          playerRef.current.seekTo(startTime);
        }
      }
    }
    
    setPlaying(true);
  };

  const handleVideoSelect = (index) => {
    console.log("Selecting video at index:", index);
    setSelectedVideoIndex(index);
    // Reset player if needed
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
    setPlaying(true);
    
    // Clear any justifications when changing videos
    setShowJustification(false);
    setJustificationText("");
  };

  // Calculate progress metrics
  const quizProgress = totalQuizzes > 0 ? Math.round((completedQuizzes.length / totalQuizzes) * 100) : 0;
  const pollProgress = totalPolls > 0 ? Math.round((completedPolls.length / totalPolls) * 100) : 0;
  
  // Helper function to determine progress color
  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6 border border-blue-100">
          {/* Video player with smooth corners */}
          <div className="aspect-video relative">
            {allVideos.length > 0 && (
              <ReactPlayer
                ref={playerRef}
                url={allVideos[selectedVideoIndex]?.videoUrl}
                width="100%"
                height="100%"
                playing={playing}
                controls
                onProgress={handleProgress}
                className="rounded-t-xl"
              />
            )}
            
            {/* Floating progress indicator */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {progressPercentage}% Complete
            </div>
          </div>
          
          {/* Progress bar beneath video */}
          <div className="h-2 w-full bg-gray-200">
            <div 
              className={`h-full ${getProgressColor(progressPercentage)} transition-all duration-300 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Current video info with progress details */}
          {allVideos.length > 0 && selectedVideoIndex < allVideos.length && (
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {allVideos[selectedVideoIndex]?.title || `Video ${selectedVideoIndex + 1}`}
                  </h2>
                  {allVideos[selectedVideoIndex]?.description && (
                    <p className="mt-2 text-gray-700">{allVideos[selectedVideoIndex].description}</p>
                  )}
                </div>
                
                {/* User score badge */}
                <div className="bg-blue-600 text-white font-bold rounded-full px-4 py-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Score: {userScore}
                </div>
              </div>
              
              {/* Progress details toggle */}
              <button 
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                onClick={() => setShowProgressDetails(!showProgressDetails)}
              >
                {showProgressDetails ? 'Hide Details' : 'Show Progress Details'}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${showProgressDetails ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Detailed progress section */}
              {showProgressDetails && (
                <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                  {/* Quiz progress */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Quizzes Completed</span>
                      <span className="text-sm font-medium text-gray-700">{completedQuizzes.length}/{totalQuizzes}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColor(quizProgress)} transition-all duration-300`} 
                        style={{ width: `${quizProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Poll progress */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Polls Answered</span>
                      <span className="text-sm font-medium text-gray-700">{completedPolls.length}/{totalPolls}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColor(pollProgress)} transition-all duration-300`} 
                        style={{ width: `${pollProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Wrong attempts summary */}
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Incorrect Answers:</p>
                    {Object.keys(wrongAttempts).length > 0 ? (
                      <ul className="text-sm text-gray-600 pl-5 list-disc">
                        {Object.entries(wrongAttempts).map(([quizId, count]) => (
                          <li key={quizId}>Quiz #{quizId}: {count} incorrect {count === 1 ? 'attempt' : 'attempts'}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">No incorrect answers yet. Great job!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quiz Modal */}
        {currentQuiz && (
          <QuizModal
            quiz={currentQuiz}
            onClose={() => {
              console.log("Quiz closed without answering");
              setCurrentQuiz(null);
              setPlaying(true);
            }}
            onAnswer={handleQuizAnswer}
          />
        )}

        {/* Poll Modal */}
        {currentPoll && (
          <PollModal
            poll={currentPoll}
            onClose={() => {
              console.log("Poll closed without voting");
              setCurrentPoll(null);
              setPlaying(true);
            }}
            onVote={handlePollVote}
          />
        )}

        {/* Justification Modal */}
        {showJustification && (
          <JustificationModal
            isLoading={justificationLoading}
            justification={justificationText}
            wrongAnswer={currentWrongAnswer}
            isQuiz={isQuizJustification}
            onClose={handleJustificationClose}
          />
        )}

        {/* Video Selection Grid - Enhanced UI */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 border border-blue-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Available Videos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allVideos.map((video, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition transform hover:scale-102 ${
                  selectedVideoIndex === index 
                    ? 'bg-blue-50 border-blue-500 shadow-md' 
                    : 'hover:bg-gray-50 hover:border-gray-300'
                }`}
                onClick={() => handleVideoSelect(index)}
              >
                <div className="flex items-start">
                  {/* Thumbnail placeholder */}
                  <div className="w-16 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{video.title || `Video ${index + 1}`}</h3>
                    {video.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{video.description}</p>
                    )}
                    {/* Indicator for video with quizzes/polls */}
                    {video.transcriptText && typeof video.transcriptText === 'object' && (
                      <div className="flex mt-2 space-x-2">
                        {video.transcriptText.quizzes && video.transcriptText.quizzes.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            {video.transcriptText.quizzes.length} Quizzes
                          </span>
                        )}
                        {video.transcriptText.polls && video.transcriptText.polls.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {video.transcriptText.polls.length} Polls
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
