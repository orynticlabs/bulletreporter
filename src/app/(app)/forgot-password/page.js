'use client'

import { useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { getRecaptchaToken } from '@/utils/recaptcha';
function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const recaptchaToken = await getRecaptchaToken('forgot_password');
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed')
      toast({
        title: "सफल",
        description: "पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।",
      });
    } catch (error) {
      toast({
        title: "त्रुटि",
        description: error.message || "पासवर्ड रीसेट ईमेल भेजने में विफल। कृपया पुनः प्रयास करें।",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showBreakingNews={false}>
      <div className="min-h-[70vh] bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default ForgotPassword; 
