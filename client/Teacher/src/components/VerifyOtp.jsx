import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { userContext } from '../context/UserLogin';

const VerifyOtp = () => {
  const context = useContext(userContext);
  const { userId, user } = context;
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifyLoader, setVerifyLoader] = useState(false);
  const [resendLoader, setResendLoader] = useState(false);

  useEffect(() => {
    // Check if we have necessary user data
    if (!userId || !user?.email) {
      const storedUserId = localStorage.getItem('tracker-id-teacher');
      const storedEmail = localStorage.getItem('tracker-email-teacher');
      
      if (!storedUserId || !storedEmail) {
        toast.error('User session expired. Please login again.');
        navigate('/login');
      }
    }
  }, [userId, user, navigate]);

  useEffect(() => {
    if (disabled) {
      setCountdown(30);
      const timer = setTimeout(() => setDisabled(false), 30000);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [disabled]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const isLoggedin = localStorage.getItem('tracker-token-teacher');
    if (isLoggedin) return navigate('/dashboard');

    if (!otp) {
      toast.error('OTP is required.');
      return;
    }

    setVerifyLoader(true);
    try {
      // Get userId from context or localStorage as a fallback
      const userIdToSend = userId || localStorage.getItem('tracker-id-teacher');
      
      if (!userIdToSend) {
        toast.error('User session expired. Please login again.');
        navigate('/login');
        return;
      }

      const response = await axios.post('http://localhost:8000/api/teacher-auth/otp', { 
        otp, 
        userId: userIdToSend 
      });

      if (response.data.success === 1) {
        toast.success(response.data.msg);
        
        // Save the token if provided in the response
        if (response.data.token) {
          localStorage.setItem('tracker-token-teacher', response.data.token);
        }
        
        // Update user info if provided
        if (response.data.user) {
          localStorage.setItem('tracker-name-teacher', response.data.user.name || '');
          localStorage.setItem('tracker-email-teacher', response.data.user.email || '');
        }
        
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        toast.error('Invalid OTP, please try again.');
      }
    } catch (error) {
      if (error.response?.data?.success === 0) {
        toast.error(error.response.data.msg);
        console.error(error.response.data);
      } else {
        toast.error('An error occurred. Please try again later.');
        console.error(error);
      }
    }
    setVerifyLoader(false);
  };

  const handleSendOtp = async () => {
    setResendLoader(true);
    try {
      // Use userId from context or localStorage as a fallback
      const userIdToSend = userId || localStorage.getItem('tracker-id-teacher');
      const emailToSend = user?.email || localStorage.getItem('tracker-email-teacher');
      
      if (!userIdToSend || !emailToSend) {
        toast.error('User session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      setDisabled(true);
      const response = await axios.post('http://localhost:8000/api/teacher-auth/sendotp', {
        userId: userIdToSend,
        email: emailToSend,
      });

      if (response.data.success === 1) {
        toast.success(response?.data?.msg);
      } else {
        toast.error(response?.data?.msg || 'Failed to send OTP.');
      }
    } catch (error) {
      setDisabled(false);
      if (error.response?.data?.success === 0) {
        toast.error(error.response.data.msg);
        console.error(error.response.data);
      } else {
        toast.error('Something went wrong');
        console.error(error);
      }
    }
    setResendLoader(false);
  };

  return (
    <div className="grid grid-cols-1 grid-rows-1 md:grid-cols-1 h-screen w-screen">
      <div className="flex justify-center items-center bg-[#222222] p-4 md:p-0">
        <div className="flex flex-col shadow-2xl w-full max-w-md p-4 sm:p-6 rounded-xl border-2 bg-gray-300 border-black">
          <h1 className="text-2xl sm:text-3xl font-semibold underline mb-6 text-center text-black">
            Verify OTP
          </h1>
          <p className="text-center text-gray-700 mb-4">
            A verification code has been sent to your email address.
            Please enter the code below.
          </p>

          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col relative">
              <label htmlFor="otp" className="text-black font-medium mb-1">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                className="outline-none p-3 border-2 border-gray-400 rounded-md focus:border-black"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit code"
              />
            </div>

            <button
              type="submit"
              className="mt-4 sm:mt-6 w-full py-3 rounded-md font-semibold text-xl bg-black text-white hover:bg-gray-800"
              disabled={verifyLoader}
            >
              {verifyLoader ? (
                <div
                  className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-white rounded-full"
                  role="status"
                  aria-label="loading"
                >
                  <span className="sr-only">Loading...</span>
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>

            <div className="flex justify-center items-center mt-4">
              <button
                type="button"
                disabled={disabled || resendLoader}
                onClick={handleSendOtp}
                className={`w-full py-2 text-center rounded-md font-medium text-lg transition-colors duration-300 ${
                  disabled || resendLoader
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-800'
                }`}
              >
                {resendLoader ? (
                  <div
                    className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-white rounded-full"
                    role="status"
                    aria-label="loading"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                ) : disabled ? (
                  `Resend OTP in ${countdown}s`
                ) : (
                  'Resend OTP'
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-700 text-sm">
                Didn't receive the code? Check your spam folder or request a new one.
              </p>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default VerifyOtp;