"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Lock, Mail, User, Phone, Shield, ArrowLeft } from "lucide-react"
import { loginUser, register, verifyOtp } from "../api/authApi"
import { toast } from "react-toastify"
import { login } from "../redux/slices/authSlices"
import { useDispatch } from "react-redux"

const AuthModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const [currentStep, setCurrentStep] = useState("auth") // "auth", "otp", "complete"
  const [mode, setMode] = useState("login")
  const [isRegistered, setIsRegistered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    image: null,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const validateForm = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[0-9]{10}$/

    if (mode === "register") {
      if (!formData.name.trim()) newErrors.name = "Name required"
      if (!formData.phone.trim()) newErrors.phone = "Phone required"
      else if (!phoneRegex.test(formData.phone)) newErrors.phone = "Invalid phone"
      if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password"
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match"
    }

    if (!formData.email.trim()) newErrors.email = "Email required"
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email"

    if (!formData.password) newErrors.password = "Password required"
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (mode === "login") {
        const loginData = {
          email: formData.email,
          password: formData.password,
        }
        const response = await loginUser(loginData)
        console.log("response", response)
        dispatch(login({ user: response.data, token: response?.data?.token }))
        localStorage.setItem("authToken", response?.data?.token)
        localStorage.setItem("userData", JSON.stringify(response?.data?.user))
        toast.success(response?.data?.message, {
          style: {
            background: "transparent",
            backdropFilter: "blur(10px)",
            color: "#000",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            fontWeight: 500,
            border: "1px solid #333333",
          },
          icon: "⚠️",
        })
        onClose()
      } else {
        console.log('form',formData);
        // Create FormData for file upload
        const registerFormData = new FormData()
        registerFormData.append("name", formData.name)
        registerFormData.append("email", formData.email)
        registerFormData.append("phoneNumber", formData.phone)
        registerFormData.append("password", formData.password)

        // Only append image if one is selected
        if (formData.image) {
          registerFormData.append("image", formData.image)
        }
      // Debugging - log the actual FormData contents
            for (let [key, value] of registerFormData.entries()) {
                console.log(key, value)
            }
       
        const response = await register(registerFormData)
        console.log("Registration successful:", response)
        toast.success(response.message, {
          style: {
            background: "transparent",
            backdropFilter: "blur(10px)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            fontWeight: 500,
            border: "1px solid #333333",
          },
          icon: "⚠️",
        })
        setCurrentStep("otp")
      }
    } catch (error) {
      console.error("Auth error:", error)
      toast.error(error?.response?.data?.message || "Authentication failed", {
        style: {
          background: "transparent",
          backdropFilter: "blur(10px)",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "16px",
          fontWeight: 500,
          border: "1px solid #333333",
        },
        icon: "❌",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpSubmit = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 6) return

    setIsLoading(true)
    try {
      const otpData = {
        email: formData.email,
        otp: otpValue,
      }
      const response = await verifyOtp(otpData)
      console.log("OTP verification successful:", response)
      setIsRegistered(true)
      setCurrentStep("complete")
      toast.success(response.message || "OTP verified successfully!", {
        style: {
          background: "transparent",
          backdropFilter: "blur(10px)",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "16px",
          fontWeight: 500,
          border: "1px solid #333333",
        },
        icon: "✅",
      })
      setTimeout(() => {
        setCurrentStep("auth")
        setMode("login")
      }, 2000)
    } catch (error) {
      console.error("OTP error:", error)
      toast.error(error.message || "OTP verification failed", {
        style: {
          background: "transparent",
          backdropFilter: "blur(10px)",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "16px",
          fontWeight: 500,
          border: "1px solid #333333",
        },
        icon: "❌",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", image: null })
    setErrors({})
    setOtp(["", "", "", "", "", ""])
  }

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login")
    resetForm()
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP)", {
          style: {
            background: "transparent",
            backdropFilter: "blur(10px)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            fontWeight: 500,
            border: "1px solid #333333",
          },
          icon: "❌",
        })
        return
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        toast.error("Image size should be less than 5MB", {
          style: {
            background: "transparent",
            backdropFilter: "blur(10px)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            fontWeight: 500,
            border: "1px solid #333333",
          },
          icon: "❌",
        })
        return
      }

      setFormData({ ...formData, image: file })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl shadow-3xl border border-white/30 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 text-center bg-gradient-to-r from-white/15 to-green-600/20">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-l from-white/65 to-green-600/50 shadow-xl rounded-xl flex items-center justify-center">
            {currentStep === "otp" ? (
              <Shield className="w-6 h-6 text-white shadow-xl" />
            ) : (
              <Lock className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {currentStep === "otp"
              ? "Verify OTP"
              : currentStep === "complete"
                ? "Welcome!"
                : mode === "login"
                  ? "Welcome Back"
                  : "Create Account"}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {currentStep === "otp"
              ? `Code sent to ${formData.email}`
              : currentStep === "complete"
                ? "Registration successful!"
                : mode === "login"
                  ? "Sign in to continue"
                  : "Join us today"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === "complete" ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-300">You can now sign in!</p>
            </div>
          ) : currentStep === "otp" ? (
            <div className="space-y-6">
              <button
                onClick={() => setCurrentStep("auth")}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-12 text-center text-lg font-bold bg-black/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                ))}
              </div>
              <button
                onClick={handleOtpSubmit}
                disabled={isLoading || otp.join("").length !== 6}
                className="w-full py-3 bg-gradient-to-r from-white/15 to-green-600/20 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          ) : (
            <>
              {/* Mode Toggle */}
              <div className="flex bg-black/20 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    mode === "login"
                      ? "bg-gradient-to-r from-white/15 to-green-600/20 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    mode === "register"
                      ? "bg-gradient-to-r from-white/15 to-green-600/20 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {mode === "register" && (
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                )}

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 bg-black/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>

                {mode === "register" && (
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {mode === "register" && (
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Profile Image (Optional)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 bg-black/50 border border-slate-600 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-white hover:file:bg-blue-500/30 cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {formData.image && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Selected: {formData.image.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: null })}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-white/15 to-green-600/20 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </div>
                  ) : mode === "login" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {mode === "login" && (
                <div className="text-center mt-4">
                  <button className="text-sm text-white hover:text-blue-300">Forgot password?</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
