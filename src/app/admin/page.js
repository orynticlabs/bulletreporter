'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Eye,
  TrendingUp,
  Calendar,
  Clock,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        setIsLoading(true);

        // Debug environment variable
        // console.log('REACT_APP_API_URL:', process.env.NEXT_PUBLIC_API_URL);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        // console.log('Using API URL:', apiUrl); // Debug line

        // Fetch analytics
        const analyticsResponse = await axios.get(`${apiUrl}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          },
        });

        const { totalArticles, totalViews } = analyticsResponse.data;

        // Fetch users for active users count
        const usersResponse = await axios.get(`${apiUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch today's published articles
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const todayArticlesResponse = await axios.get(`${apiUrl}/news`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: todayStart.toISOString(),
            endDate: todayEnd.toISOString(),
          },
        });

        setStats([
          {
            title: "कुल लेख",
            value: totalArticles.toString(),
            change: "+12%", // Placeholder; calculate from historical data if available
            icon: FileText,
            color: "text-primary",
          },
          {
            title: "आज के व्यूज़",
            value: totalViews.toLocaleString(),
            change: "+8.2%", // Placeholder
            icon: Eye,
            color: "text-accent",
          },
          {
            title: "सक्रिय उपयोगकर्ता",
            value: usersResponse.data.length.toLocaleString(),
            change: "+15%", // Placeholder
            icon: Users,
            color: "text-primary-dark",
          },
          {
            title: "पब्लिश किए गए लेख",
            value: todayArticlesResponse.data.articles.length.toString(),
            change: "आज",
            icon: TrendingUp,
            color: "text-accent-dark",
          },
        ]);

        // Fetch recent articles
        const articlesResponse = await axios.get(`${apiUrl}/news`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 4 },
        });

        setRecentArticles(articlesResponse.data.articles.map(article => ({
          title: article.title,
          status: article.status,
          views: article.views,
          publishedAt: article.status === 'draft' 
            ? 'ड्राफ्ट' 
            : article.status === 'scheduled' 
              ? new Date(article.updated_at).toLocaleTimeString('hi-IN')
              : new Date(article.created_at).toLocaleTimeString('hi-IN'),
          category: article.category || 'अन्य',
        })));

      } catch (error) {
        // console.error('Dashboard fetch error:', error.response?.data || error.message);
        toast({
          title: "डेटा लोड करने में त्रुटि",
          description: error.response?.data?.message || "सर्वर से डेटा प्राप्त करने में असमर्थ",
          variant: "destructive",
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('adminAuthToken');
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('user');
          router.push('/admin/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">प्रकाशित</Badge>;
      case 'draft':
        return <Badge variant="secondary">ड्राफ्ट</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">निर्धारित</Badge>;
      default:
        return <Badge variant="outline">अज्ञात</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">डैशबोर्ड</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('hi-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button className="gradient-primary text-white" onClick={() => router.push('/admin/articles/new')}>
          <Plus className="w-4 h-4 mr-2" />
          नया लेख लिखें
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill().map((_, index) => (
            <Card key={index} className="news-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <Card key={index} className="news-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">{stat.change}</span> पिछले महीने से
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              हाल के लेख
            </CardTitle>
            <CardDescription>
              आपके हाल ही में बनाए गए लेखों की सूची
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array(4).fill().map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="flex items-center space-x-4">
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))
              ) : (
                recentArticles.map((article, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground line-clamp-1">
                        {article.title}
                      </h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span className="category-tag text-xs">
                          {article.category}
                        </span>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {article.publishedAt}
                        </div>
                        {article.views > 0 && (
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {article.views.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(article.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Today's Schedule */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LayoutDashboard className="w-5 h-5 mr-2 text-primary" />
                त्वरित कार्य
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/articles/new')}>
                <Plus className="w-4 h-4 mr-2" />
                नया लेख बनाएं
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/articles')}>
                <FileText className="w-4 h-4 mr-2" />
                ड्राफ्ट देखें
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/comments')}>
                <Users className="w-4 h-4 mr-2" />
                कमेंट्स प्रबंधन
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/analytics')}>
                <TrendingUp className="w-4 h-4 mr-2" />
                एनालिटिक्स देखें
              </Button>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-accent" />
                आज का शेड्यूल
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">मॉर्निंग न्यूज़ अपडेट</div>
                    <div className="text-sm text-muted-foreground">सुबह 9:00 बजे</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">पूर्ण</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">राजनीति रिपोर्ट</div>
                    <div className="text-sm text-muted-foreground">दोपहर 2:00 बजे</div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">प्रगति में</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">इवनिंग समरी</div>
                    <div className="text-sm text-muted-foreground">शाम 6:00 बजे</div>
                  </div>
                  <Badge variant="outline">लंबित</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;