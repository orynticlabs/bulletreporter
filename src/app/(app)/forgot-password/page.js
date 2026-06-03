'use client'

import { useState } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await axios.post(`${apiUrl}/auth/forgot-password`, { email });
      
      toast({
        title: "सफल",
        description: response.data.message || "पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।",
      });
    } catch (error) {
      // console.error('Forgot password error:', error.response?.data || error.message);
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "पासवर्ड रीसेट ईमेल भेजने में विफल। कृपया पुनः प्रयास करें।",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-primary">पासवर्ड भूल गए?</CardTitle>
          <CardDescription className="text-muted-foreground">अपना ईमेल दर्ज करें और हम आपको पासवर्ड रीसेट लिंक भेजेंगे।</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ईमेल</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="अपना ईमेल दर्ज करें"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "भेज रहा है..." : "रीसेट लिंक भेजें"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link href="/admin-login" className="text-sm text-primary hover:underline">
              लॉगिन पेज पर वापस जाएं
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword; 