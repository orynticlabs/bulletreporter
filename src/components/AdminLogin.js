'use client'

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';


function AdminLogin({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // console.log('REACT_APP_API_URL:', process.env.NEXT_PUBLIC_API_URL); // Debug line

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // console.log('Using API URL:', apiUrl); // Debug line
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password,
      });

      const { user, token } = response.data;
      if (user.role !== 'ADMIN') {
        throw new Error('केवल प्रशासक उपयोगकर्ता डैशबोर्ड तक पहुंच सकते हैं');
      }

      localStorage.setItem('adminAuthToken', token);
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('userInfo', JSON.stringify({ ...user, token })); // Added token to userInfo

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("adminAuthChange"));
      
      // Call the onAuthSuccess callback if provided
      if (onAuthSuccess) {
        onAuthSuccess();
      }

      toast({
        title: "लॉगिन सफल",
        description: "एडमिन पैनल में आपका स्वागत है",
      });

      router.push("/admin");
    } catch (error) {
      // console.error('Frontend login error:', error.response?.data || error.message);
      toast({
        title: "लॉगिन असफल",
        description: error.response?.data?.message || "गलत ईमेल या पासवर्ड",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-300 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Bullet News Reporter Logo" className="w-20 h-12 mr-3 rounded-lg shadow-md" />
            <h1 className="text-2xl font-bold">Bullet News Reporter</h1>
          </div>
          <CardTitle className="text-xl font-semibold text-white">एडमिन लॉगिन</CardTitle>
          <p className="text-red-100 text-sm">अपने एडमिन पैनल में प्रवेश करें</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">ईमेल</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="अपना ईमेल दर्ज करें"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500 h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">पासवर्ड</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="अपना पासवर्ड दर्ज करें"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-gray-300 focus:border-red-500 focus:ring-red-500 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right">
                <a href="/forgot-password" className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors">
                  पासवर्ड भूल गए?
                </a>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  लॉगिन हो रहा है...
                </div>
              ) : (
                "लॉगिन करें"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="text-sm border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300"
            >
              मुख्य साइट पर वापस जाएं
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLogin;