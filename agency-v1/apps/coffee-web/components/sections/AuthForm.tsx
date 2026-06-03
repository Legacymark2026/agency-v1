"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import gsap from "gsap";
import { Mail, Lock, User, Coffee, Sparkles, ArrowRight, AlertCircle } from "lucide-react";

export default function AuthForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const nameFieldRef = useRef<HTMLDivElement>(null);

  // Animate inputs expansion when switching modes
  useEffect(() => {
    if (nameFieldRef.current) {
      if (!isLogin) {
        // Slide down and fade in Name field
        gsap.killTweensOf(nameFieldRef.current);
        gsap.fromTo(
          nameFieldRef.current,
          { height: 0, opacity: 0, marginBottom: 0 },
          { height: 76, opacity: 1, marginBottom: 16, duration: 0.4, ease: "power2.out" }
        );
      } else {
        // Slide up and fade out Name field
        gsap.killTweensOf(nameFieldRef.current);
        gsap.to(nameFieldRef.current, {
          height: 0,
          opacity: 0,
          marginBottom: 0,
          duration: 0.3,
          ease: "power2.in"
        });
      }
    }

    // Gentle shake animation on card for mode switch
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.98, opacity: 0.9 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.4)" }
      );
    }

    setError("");
  }, [isLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError(t("error_invalid"));
      return;
    }

    setLoading(true);

    // Simulate Network Request
    setTimeout(() => {
      setLoading(false);
      
      if (isLogin) {
        // Mock Login
        const savedUserJson = localStorage.getItem("goldneez_user");
        let userToLogIn = { name: "Carlos Barista", email: "admin@goldneez.com" };

        if (savedUserJson) {
          const savedUser = JSON.parse(savedUserJson);
          if (savedUser.email.toLowerCase() === email.toLowerCase()) {
            userToLogIn = savedUser;
          }
        }

        // Set session
        localStorage.setItem("goldneez_session", "active");
        localStorage.setItem("goldneez_current_user", JSON.stringify(userToLogIn));
        
        // Dispatch custom login event for Header
        window.dispatchEvent(new Event("user-login"));
        
        router.push("/dashboard");
      } else {
        // Mock Register
        const newUser = {
          name,
          email,
          points: 500, // Gift 500 points on registration!
          registeredAt: new Date().toLocaleDateString()
        };

        // Create initial default subscription
        const initialSub = {
          beans: "signature-blend",
          frequency: "30",
          status: "active",
          nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };

        localStorage.setItem("goldneez_user", JSON.stringify(newUser));
        localStorage.setItem("goldneez_current_user", JSON.stringify(newUser));
        localStorage.setItem("goldneez_subscription", JSON.stringify(initialSub));
        localStorage.setItem("goldneez_session", "active");

        // Dispatch custom login event for Header
        window.dispatchEvent(new Event("user-login"));

        router.push("/dashboard");
      }
    }, 1500);
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[70vh] py-12 px-4 select-none">
      <div 
        ref={cardRef}
        className="w-full max-w-md bg-black/45 backdrop-blur-xl border border-aluminum/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-8 transition-all duration-300"
      >
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-amber/10 rounded-2xl border border-amber/20 text-amber animate-pulse">
            <Coffee size={28} />
          </div>
        </div>

        {/* Title */}
        <h2 className="font-cinzel text-center text-amber text-2xl sm:text-3xl font-bold tracking-wider mb-2">
          {isLogin ? t("login_title") : t("register_title")}
        </h2>
        <p className="font-quattrocento text-center text-xs sm:text-sm text-aluminum-dark mb-8 leading-relaxed">
          {isLogin ? t("login_subtitle") : t("register_subtitle")}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-quattrocento animate-shake">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Name Input Container (GSAP Animated) */}
          <div ref={nameFieldRef} className="overflow-hidden opacity-0 h-0 flex flex-col">
            <label className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mb-2 block font-medium">
              {t("name_label")}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-aluminum-dark" size={16} />
              <input
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3.5 pl-12 pr-4 text-sm font-quattrocento text-aluminum focus:outline-none transition-all placeholder-aluminum-dark"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="flex flex-col">
            <label className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mb-2 block font-medium">
              {t("email_label")}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-aluminum-dark" size={16} />
              <input
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3.5 pl-12 pr-4 text-sm font-quattrocento text-aluminum focus:outline-none transition-all placeholder-aluminum-dark"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <label className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mb-2 block font-medium">
              {t("password_label")}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-aluminum-dark" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3.5 pl-12 pr-4 text-sm font-quattrocento text-aluminum focus:outline-none transition-all placeholder-aluminum-dark"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-amber hover:bg-amber-light text-black font-quattrocento uppercase tracking-widest text-xs font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(249,178,51,0.15)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black/25 border-t-black animate-spin" />
            ) : (
              <>
                {isLogin ? t("login_btn") : t("register_btn")}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Switch mode trigger */}
        <div className="mt-8 border-t border-aluminum/10 pt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-quattrocento text-xs text-aluminum-dark hover:text-amber transition-colors cursor-pointer select-none"
          >
            {isLogin ? t("switch_to_register") : t("switch_to_login")}
          </button>
        </div>

      </div>
    </div>
  );
}
