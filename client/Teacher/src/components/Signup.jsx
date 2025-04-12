import { useState,useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { userContext } from "../context/UserLogin";

export function Signup() {
    const navigate = useNavigate();
    const [loader, setLoader] = useState(false);
    const context = useContext(userContext);
        const { setUserId, setUser } = context;
    const [userInput, setUserInput] = useState({
        name: "",
        email: "",
        password: "",
        age: "",
        institute: "",
        exprience: ""
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserInput({ ...userInput, [name]: value });
    };

    const validateForm = () => {
        const newErrors = {};
        Object.entries(userInput).forEach(([key, value]) => {
            if (!value.trim()) {
                newErrors[key] = `Please enter your ${key}`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoader(true);
        try {
            const response = await axios.post("http://localhost:8000/api/teacher-auth/signup", {
                ...userInput,
                isTeacher: true
            });

            if (response?.data?.success) {
                console.log(response.data);
                toast.success(response.data.msg || "Signup successful");
                setUser(response.data.user);
                setUserId(response.data.user._id);
                setTimeout(() => navigate("/Otp"), 1500);
            } else {
                toast.error(response.data.msg || "Signup failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Signup error occurred");
        }
        setLoader(false);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 h-screen w-full">
                <div className="bg-black flex justify-center items-center">
                    <h1 className="font-serif text-5xl font-semibold text-white text-center p-5 rounded-xl shadow-md"> VidyaLoop
                        <h5 className="text-[12px] py-3.5 text-left ml-3 text-gray-300 opacity-70">Knowledge, Learning Through Iteration. </h5>
                    </h1>
                </div>
                <div className="flex justify-center items-center bg-[#222222] p-4">
                    <div className="bg-gray-300 shadow-2xl p-6 rounded-xl border-2 border-black w-full max-w-md">
                        <h1 className="text-3xl font-semibold  text-center mb-6 text-black">Teacher Signup</h1>
                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                            {[
                                { label: "Full Name", name: "name", type: "text" },
                                { label: "Email Address", name: "email", type: "email" },
                                { label: "Password", name: "password", type: "password" },
                                { label: "Age", name: "age", type: "text" },
                                { label: "Institute", name: "institute", type: "text" },
                                { label: "Experience", name: "exprience", type: "text" },
                            ].map(({ label, name, type }) => (
                                <div className="flex flex-col" key={name}>
                                    <label htmlFor={name} className="text-black font-medium mb-1">{label}</label>
                                    <input
                                        type={type}
                                        name={name}
                                        id={name}
                                        value={userInput[name]}
                                        onChange={handleChange}
                                        className={`p-2 border-2 rounded-md ${
                                            errors[name] ? "border-black" : "border-gray-400"
                                        } focus:outline-none focus:border-black`}
                                        placeholder={`Enter your ${name}`}
                                    />
                                    {errors[name] && (
                                        <span className="text-sm text-gray-800 mt-1">{errors[name]}</span>
                                    )}
                                </div>
                            ))}

                            <button
                                type="submit"
                                className={`mt-4 w-full py-2 rounded-md font-semibold text-xl ${
                                    loader ? "bg-gray-500 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"
                                }`}
                                disabled={loader}
                            >
                                {loader ? (
                                    <div className="animate-spin size-5 mx-auto border-[3px] border-white border-t-transparent rounded-full" />
                                ) : (
                                    "Create Account"
                                )}
                            </button>

                            <p
                                className="mt-4 text-sm text-center text-black underline cursor-pointer hover:text-gray-800"
                                onClick={() => navigate("/login")}
                            >
                                Already have an account? Login
                            </p>
                        </form>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
