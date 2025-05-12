"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";

export default function SignUpPage() {
  const [username, setUsername] = useState(""); // Changed from name to username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    // Basic validation
    if (!username || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // Call our auth service to register the user
      const result = await authService.signup({
        username,
        email,
        password,
      });

      setSuccessMessage(result.message || "Registration successful!");
      
      // Short delay to show the success message before signing in
      setTimeout(async () => {
        // If registration is successful, sign in the user
        try {
          const signInResult = await signIn("credentials", {
            redirect: false,
            username,
            password,
          });

          if (signInResult?.error) {
            setError(signInResult.error);
            setLoading(false);
          } else if (signInResult?.ok) {
            router.push("/dashboard"); // Redirect to dashboard after successful registration and sign-in
          }
        } catch (signInError) {
          setError("Sign in failed after registration. Please try signing in manually.");
          setLoading(false);
        }
      }, 1500);
    } catch (err: any) {
      // Display the error message from the server if available
      setError(
        err.data?.message || 
        err.message || 
        "Registration failed. Please try again."
      );
      setLoading(false);
      console.error("Registration error:", err);
    }
  };

  return (
    <div style={{ 
      maxWidth: "400px", 
      margin: "50px auto", 
      padding: "20px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      backgroundColor: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Sign Up</h1>
      
      <form onSubmit={handleSubmit}>
        {successMessage && (
          <div style={{
            padding: "10px",
            backgroundColor: "#e8f5e9",
            color: "#2e7d32",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            {successMessage}
          </div>
        )}
        
        {error && (
          <div style={{
            padding: "10px",
            backgroundColor: "#ffebee",
            color: "#d32f2f",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="username" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "5px"
            }}
          />
        </div>
        
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "5px"
            }}
          />
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "5px"
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{ 
            width: "100%",
            padding: "12px", 
            backgroundColor: loading ? "#ccc" : "blue",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500"
          }}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
      
      <p style={{ marginTop: "20px", textAlign: "center" }}>
        Already have an account?{" "}
        <a href="/auth/signin" style={{ color: "blue", textDecoration: "none" }}>
          Sign In
        </a>
      </p>
    </div>
  );
}
