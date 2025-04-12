import axios from "axios";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { userContext } from "../context/UserLogin";

export default function Login() {
    const context = useContext(userContext)
    const {setUser, user} = context
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);
    const [touchedFields, setTouchedFields] = useState({});
    const [enabled, setDisabled] = useState(false)
    const [userInput, setUserInput] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const validateInput = (name, value) => {
        if (name === "email") {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Please enter a valid email address";
            }
        } else if (name === "password") {
            if (!/^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/.test(value)) {
                return "Password must be 8-16 characters & include one special character";
            }
        }
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const errorMessage = validateInput(name, value);

        setUserInput({ ...userInput, [name]: value });
        setErrors({ ...errors, [name]: errorMessage });
        setTouchedFields({ ...touchedFields, [name]: true });
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouchedFields({ ...touchedFields, [name]: true });
        
        // Check for empty required fields on blur
        if (!value) {
            setErrors({ ...errors, [name]: `Please enter your ${name}` });
        }
    };

    let isFormValid =
        !Object.values(errors).some(error => error) &&
        Object.values(userInput).every(value => value);

    const handleSendOtp = async () => {
        setLoader(true)
        try {
            const userId = localStorage.getItem("tracker-id")
            setDisabled(true); // Disable the button immediately
            const response = await axios.post('http://localhost:8000/api/sendotp', { userId, email: user?.email });
            
            if (response.data.success === 1) {
                toast.success(response?.data?.msg);
            } else {
                toast.error(response?.data?.msg || 'Failed to send OTP.');
            }
        } catch (error) {
            setDisabled(false); // Re-enable the button if an error occurs
            if (error.response?.data?.success === 0) {
                toast.error(error.response.data.msg);
                console.error(error.response.data);
            } else {
                toast.error('');
                console.error(error);
            }
        }
        setLoader(false)
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Mark all fields as touched to show all validation errors
        const allTouched = Object.keys(userInput).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setTouchedFields(allTouched);
        
        // Check for empty fields
        const newErrors = {...errors};
        Object.keys(userInput).forEach(key => {
            if (!userInput[key]) {
                newErrors[key] = `Please enter your ${key}`;
            }
        });
        setErrors(newErrors);

        if (!isFormValid) {
            return toast.error("Please fill all required fields correctly");
        }
        
        setLoader(true);

        try {
            const response = await axios.get("http://localhost:8000/api/auth/signin", {
                params: { email: userInput.email, password: userInput.password },
            });

            const data = response?.data;
            console.log(data)
            if (data?.success == 0) {
                toast.error(data?.msg)
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach((error) => {
                        const field = error.path[0];
                        const message = error.message;
                        setErrors((prevErrors) => ({ ...prevErrors, [field]: message }));
                    });
                }
                setLoader(false);
                return toast.error(data?.msg || "Something went wrong");
            }
            if(data?.success===1){
                if(!data.user.isValid){
                    setUser(data?.user)
                    localStorage.setItem("tracker-email", data?.email)
                    localStorage.setItem("tracker-id", data?._id)
                    handleSendOtp()
                    setLoader(false);
                    navigate("/otp")
                }
                else {
                    localStorage.setItem("tracker-token", data?.token)
                    localStorage.setItem("tracker-name", data?.user?.name)
                    localStorage.setItem("tracker-email", data?.user?.email)
                    setLoader(false);
                    setUser(data?.user)
                    toast.success(data?.msg);
                    setTimeout(()=> navigate("/dashboard"), 2000)
                }
            }
        } catch (error) {
            if(error?.response?.data?.success==0){
                toast.error(error?.response?.data.msg)
            }
            console.error("Error during login:", error.response?.data?.success );
            setLoader(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 h-screen w-full">
                <div className="bg-black flex justify-center items-center">
                    <h1 className="font-serif text-5xl md:text-6xl font-semibold text-white text-center p-5 rounded-xl shadow-md">
                        VidyaLoop
                        <h5 className="text-[12px] py-3.5 text-left ml-3 text-gray-300 opacity-70">Knowledge, Learning Through Iteration. </h5>
                    </h1>
                </div>
                <div className="flex justify-center items-center bg-[#222222] p-4 md:p-0">
                    <div className="flex flex-col shadow-2xl w-full max-w-md p-4 sm:p-6 rounded-xl border-2 bg-gray-300 border-black">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold underline mb-6 text-center text-black">
                            Login
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
                            <div className="flex flex-col relative">
                                <label htmlFor="email" className="text-black font-medium mb-1">Email Address</label>
                                <input
                                    id="email"
                                    className={`outline-none p-2 border-2 rounded-md ${
                                        touchedFields.email && errors.email ? "border-black" : "border-gray-400"
                                    } focus:border-black`}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={userInput.email}
                                    type="text"
                                    autoComplete="off"
                                    name="email"
                                    placeholder="Enter your email"
                                />
                                {touchedFields.email && errors.email && (
                                    <span className="text-sm text-gray-800 mt-1">{errors.email}</span>
                                )}
                            </div>

                            <div className="flex flex-col relative">
                                <label htmlFor="password" className="text-black font-medium mb-1">Password</label>
                                <input
                                    id="password"
                                    className={`outline-none p-2 border-2 rounded-md ${
                                        touchedFields.password && errors.password ? "border-black" : "border-gray-400"
                                    } focus:border-black`}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={userInput.password}
                                    type="password"
                                    name="password"
                                    autoComplete="off"
                                    placeholder="Enter your password"
                                />
                                {touchedFields.password && errors.password && (
                                    <span className="text-sm text-gray-800 mt-1">{errors.password}</span>
                                )}
                            </div>
                            
                            <button
                                type="submit"
                                className={`mt-4 sm:mt-6 w-full py-2 rounded-md font-semibold text-xl ${
                                    isFormValid
                                        ? "bg-black text-white hover:bg-gray-800"
                                        : "bg-gray-500 text-gray-300 cursor-not-allowed"
                                }`}
                                disabled={!isFormValid || loader}
                            >
                                {loader ? (
                                    <div
                                        className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-white rounded-full"
                                        role="status"
                                        aria-label="loading"
                                    >
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                ) : (
                                    "Login"
                                )}
                            </button>
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm gap-2">
                                <p
                                    className="text-black underline cursor-pointer font-medium hover:text-gray-700"
                                    onClick={() => {
                                        navigate("/");
                                    }}
                                >
                                    Don't have an account? Sign Up
                                </p>
                                <p className="text-gray-700 text-center sm:text-right">
                                    By logging in, you agree to the Terms & Conditions
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </>
    );
}