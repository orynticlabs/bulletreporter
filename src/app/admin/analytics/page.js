'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye, Users, FileText, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from '@/hooks/use-toast';
import axios from "axios";

function AdminAnalytics() {
  const { toast } = useToast();
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminAuthToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [navigate]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const token = localStorage.getItem('adminAuthToken');
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      
      const response = await axios.get(`${apiUrl}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      return response.data;
    }
  });

  // Fetch top articles
  const { data: topArticles = [], isLoading: topArticlesLoading } = useQuery({
    queryKey: ['topArticles'],
    queryFn: async () => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.get(`${apiUrl}/news`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5 }
      });
      return response.data.sort((a, b) => b.views - a.views);
    }
  });

  // Fetch users count
  const { data: usersData = [], isLoading: usersLoading } = useQuery({
    queryKey: ['usersCount'],
    queryFn: async () => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.get(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading || topArticlesLoading || usersLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          एनालिटिक्स डेटा लोड करने में त्रुटि: {error.message}
        </div>
      </div>
    );
  }

  const totalViews = analyticsData?.totalViews || 0;
  const totalArticles = analyticsData?.totalArticles || 0;
  const totalUsers = usersData?.length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">एनालिटिक्स डैशबोर्ड</h1>
        <p className="text-muted-foreground">वेबसाइट के प्रदर्शन और आंकड़े देखें</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              कुल पेज व्यूज
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatNumber(totalViews)}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+18%</span>
              <span className="text-muted-foreground">पिछले महीने से</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              कुल उपयोगकर्ता
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatNumber(totalUsers)}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+12%</span>
              <span className="text-muted-foreground">पिछले सप्ताह से</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              प्रकाशित लेख
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalArticles}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+8</span>
              <span className="text-muted-foreground">इस सप्ताह</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              औसत रीडिंग टाइम
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">3.2 मिनट</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600">-5%</span>
              <span className="text-muted-foreground">पिछले महीने से</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>साप्ताहिक पेज व्यूज</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              चार्ट डेटा लोड हो रहा है...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>श्रेणी अनुसार वितरण</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              श्रेणी डेटा लोड हो रहा है...
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>सबसे लोकप्रिय लेख</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topArticles.length > 0 ? (
              topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground line-clamp-1">{article.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{article.category || 'अन्य'}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {article.views.toLocaleString()} views
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">#{index + 1}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                कोई लेख उपलब्ध नहीं है
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">अभी ऑनलाइन</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">-</div>
            <p className="text-xs text-muted-foreground">सक्रिय उपयोगकर्ता</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">आज के नए विज़िटर</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">-</div>
            <p className="text-xs text-muted-foreground">पहली बार आए उपयोगकर्ता</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">बाउंस रेट</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">-</div>
            <p className="text-xs text-muted-foreground">औसत बाउंस रेट</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminAnalytics;