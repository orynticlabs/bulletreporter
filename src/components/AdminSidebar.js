'use client'

import { usePathname } from 'next/navigation';
import Link as NavLink from 'next/link';
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Tag,
  BarChart3,
  Megaphone,
  MessageCircle,
} from "lucide-react";

import axios from 'axios';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

const adminMenuItems = [
  { title: "डैशबोर्ड", url: "/admin", icon: LayoutDashboard },
  { title: "समाचार प्रबंधन", url: "/admin/articles", icon: FileText },
  { title: "श्रेणियां", url: "/admin/categories", icon: Tag },
  { title: "उपयोगकर्ता", url: "/admin/users", icon: Users },
  { title: "टिप्पणियां", url: "/admin/comments", icon: MessageCircle },
  { title: "विज्ञापन", url: "/admin/advertisements", icon: Megaphone },
  { title: "आंकड़े", url: "/admin/analytics", icon: BarChart3 },
  { title: "सेटिंग्स", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  
  const currentPath = usePathname();
  const isCollapsed = state === "collapsed";
  const [stats, setStats] = useState({
    totalArticles: 0,
    todayViews: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const analyticsResponse = await axios.get(`${apiUrl}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
            endDate: new Date().toISOString() 
          },
        });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayArticlesResponse = await axios.get(`${apiUrl}/news`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { startDate: todayStart.toISOString(), endDate: todayEnd.toISOString() },
        });
        const todayViews = todayArticlesResponse.data.articles.reduce((total, article) => total + article.views, 0);
        setStats({
          totalArticles: analyticsResponse.data.totalArticles,
          todayViews: todayViews,
          loading: false
        });
      } catch (error) {
        // console.error('Error fetching sidebar stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  const getNavCls = ({ isActive }) =>
    isActive
      ? "bg-white text-red-700 shadow-lg border-l-4 border-yellow-500 font-semibold transform scale-105"
      : "text-red-800 hover:text-red-700 hover:bg-white/80 hover:shadow-md hover:border-l-2 hover:border-yellow-400 transition-all duration-300";

  return (
    <Sidebar className={`scrollbar-hide ${isCollapsed ? "w-16" : "w-64"} h-screen overflow-y-auto`} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-red-600 via-red-700 to-red-800 border-r-4 border-yellow-400 shadow-xl flex flex-col h-full scrollbar-hide">
        {/* Logo/Header */}
        <div className="p-6 border-b-2 border-yellow-400 bg-gradient-to-r from-red-700 to-red-800">
          <div className="flex items-center justify-center">
            {!isCollapsed ? (
              <a href="/" className="flex items-center space-x-2">
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                </div>
              </a>
            ) : (
              <div className="bg-white text-red-600 px-3 py-3 rounded-xl font-bold text-lg shadow-lg border-2 border-yellow-400">
                AP
              </div>
            )}
          </div>
        </div>

        {/* Main Menu */}
        <SidebarGroup className="px-3 py-6 flex-grow">
          <SidebarGroupLabel className={`${isCollapsed ? "sr-only" : ""} text-yellow-300 font-bold text-xs uppercase tracking-widest px-3 pb-4 border-b border-yellow-400/30`}>
            मुख्य मेनू
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu className="space-y-2">
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center gap-4 px-4 py-3 mx-1 rounded-lg transition-all duration-300 ease-in-out ${getNavCls({ isActive: currentPath === item.url || (item.url !== "/admin" && currentPath.startsWith(item.url)) })}`
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 text-yellow-300" />
                      {!isCollapsed && (
                        <span className="font-semibold text-sm tracking-wide text-white">{item.title}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats */}
        {!isCollapsed && (
          <SidebarGroup className="px-3 pb-6">
            <SidebarGroupLabel className="text-yellow-300 font-bold text-xs uppercase tracking-widest px-3 pb-4 border-b border-yellow-400/30">
              त्वरित आंकड़े
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-4">
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-yellow-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-red-700">{stats.loading ? '...' : stats.totalArticles.toLocaleString()}</div>
                      <div className="text-xs text-red-500 mt-1 font-semibold uppercase tracking-wide">कुल लेख</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md"><FileText className="h-6 w-6 text-white" /></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-2xl p-4 shadow-lg border-2 border-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-red-800">{stats.loading ? '...' : stats.todayViews.toLocaleString()}</div>
                      <div className="text-xs text-red-700 mt-1 font-semibold uppercase tracking-wide">आज के व्यूज़</div>
                    </div>
                    <div className="p-3 bg-red-600 rounded-xl shadow-md"><BarChart3 className="h-6 w-6 text-white" /></div>
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
