import { useContext, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { userContext } from "../context/UserLogin";

export function Signup() {
    const context = useContext(userContext);
    const { setUserId, setUser } = context;
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);
    const [touchedFields, setTouchedFields] = useState({});
    const [userInput, setUserInput] = useState({
        email: "",
        password: "",
        name: "",
        class: "",
        age: "",
        institute: ""
    });

    const [errors, setErrors] = useState({
        email: "",
        name: "",
        password: "",
        class: "",
        age: "",
        institute: ""
    });

    const validateInput = (name, value) => {
        if (name === "email") {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Please enter a valid email address";
            }
        } else if (name === "name") {
            if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                return "Name should not contain special characters/numbers";
            }
        } else if (name === "password") {
            if (value && !/^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/.test(value)) {
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

    const isFormValid = 
        !Object.values(errors).some(error => error) &&
        Object.values(userInput).every(value => value);

    const handelSubmit = async (e) => {
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
            const response = await axios.post("http://localhost:8000/api/auth/signup", {
                name: userInput.name,
                password: userInput.password,
                email: userInput.email,
                class: userInput.class,
                age: userInput.age,
                institute: userInput.institute
            });

            const data = response?.data;

            if (!data?.success) {
                // Process server-side validation errors
                if (data.errors && Array.isArray(data.errors)) {
                    const serverErrors = {...errors};
                    data.errors.forEach((error) => {
                        const field = error.path[0]; // The field name causing the error
                        const message = error.message; // The error message
                        serverErrors[field] = message;
                    });
                    setErrors(serverErrors);
                }
                setLoader(false);
                return toast.error(data?.msg || "Something went wrong");
            }

            if (data.success) {
                setUser(data?.user);
                setUserId(data.user._id);
                toast.success(data.msg);
                setLoader(false);
                setTimeout(() => navigate('/Otp'), 2000);
            }
        } catch (error) {
            console.error("Error during signup:", error?.response?.data || error.message);
            toast.error("Signup failed. Please try again.");
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
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold underline mb-6 text-center text-black">SignUp</h1>
                        <form onSubmit={handelSubmit} className="flex flex-col gap-3 sm:gap-4">
                            <div className="flex flex-col relative">
                                <label htmlFor="email" className="text-black font-medium mb-1">Email Address</label>
                                <input
                                    id="email"
                                    className={`outline-none p-2 border-2 rounded-md ${touchedFields.email && errors.email ? "border-black" : "border-gray-400"} focus:border-black`}
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
                                <label htmlFor="name" className="text-black font-medium mb-1">Full Name</label>
                                <input
                                    id="name"
                                    className={`outline-none p-2 border-2 rounded-md ${touchedFields.name && errors.name ? "border-black" : "border-gray-400"} focus:border-black`}
                                    autoComplete="off"
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={userInput.name}
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                />
                                {touchedFields.name && errors.name && (
                                    <span className="text-sm text-gray-800 mt-1">{errors.name}</span>
                                )}
                            </div>
                            <div className="flex flex-col relative">
                                <label htmlFor="class" className="text-black font-medium mb-1">Class</label>
                                <input
                                    id="class"
                                    className={`outline-none p-2 border-2 rounded-md ${touchedFields.class && errors.class ? "border-black" : "border-gray-400"} focus:border-black`}
                                    autoComplete="off"
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={userInput.class}
                                    type="text"
                                    name="class"
                                    placeholder="Enter your class"
                                />
                                {touchedFields.class && errors.class && (
                                    <span className="text-sm text-gray-800 mt-1">{errors.class}</span>
                                )}
                            </div>
                            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                                <div className="flex flex-col relative flex-1">
                                    <label htmlFor="age" className="text-black font-medium mb-1">Age</label>
                                    <input
                                        id="age"
                                        className={`outline-none p-2 border-2 rounded-md ${touchedFields.age && errors.age ? "border-black" : "border-gray-400"} focus:border-black`}
                                        autoComplete="off"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={userInput.age}
                                        type="text"
                                        name="age"
                                        placeholder="Your age"
                                    />
                                    {touchedFields.age && errors.age && (
                                        <span className="text-sm text-gray-800 mt-1">{errors.age}</span>
                                    )}
                                </div>
                                <div className="flex flex-col relative flex-1">
                                    <label htmlFor="institute" className="text-black font-medium mb-1">Institute</label>
                                    <input
                                        id="institute"
                                        className={`outline-none p-2 border-2 rounded-md ${touchedFields.institute && errors.institute ? "border-black" : "border-gray-400"} focus:border-black`}
                                        autoComplete="off"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={userInput.institute}
                                        type="text"
                                        name="institute"
                                        placeholder="Your institute"
                                    />
                                    {touchedFields.institute && errors.institute && (
                                        <span className="text-sm text-gray-800 mt-1">{errors.institute}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col relative">
                                <label htmlFor="password" className="text-black font-medium mb-1">Password</label>
                                <input
                                    id="password"
                                    className={`outline-none p-2 border-2 rounded-md ${touchedFields.password && errors.password ? "border-black" : "border-gray-400"} focus:border-black`}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={userInput.password}
                                    type="password"
                                    name="password"
                                    autoComplete="off"
                                    placeholder="Create a password"
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
                                disabled={!isFormValid}
                            >
                                {loader ? 
                                    <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    : "Create Account"
                                }
                            </button>
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm gap-2">
                                <p className="text-black underline cursor-pointer font-medium hover:text-gray-700" onClick={() => {
                                    navigate('/login')
                                }}>Already have an account? Login</p>
                                <p className="text-gray-700 text-center sm:text-right">
                                    By signing up, you agree to the Terms & Conditions
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