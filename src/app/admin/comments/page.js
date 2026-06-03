'use client'

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Plus, Search, MessageCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

function AdminComments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commenterName, setCommenterName] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminAuthToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [navigate]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch comments
  const { data: commentsResponse, isLoading, error } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: async () => {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      try {
        const response = await axios.get(`${apiUrl}/comments/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // console.log('Comments API response:', response.data); // Debug log
        return response.data;
      } catch (error) {
        // console.error('Error fetching comments:', error.response?.data || error.message);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  // Ensure comments is always an array - handle the API response structure
  const comments = Array.isArray(commentsResponse?.data) ? commentsResponse.data : 
                   Array.isArray(commentsResponse) ? commentsResponse : [];
  
  // console.log('Processed comments:', comments); // Debug log
  
  // Debug: Log first comment structure if available
  if (comments.length > 0) {
    // console.log('First comment structure:', comments[0]);
    // console.log('First comment keys:', Object.keys(comments[0]));
  }

  // Memoize filtered comments
  const filteredComments = useMemo(() => {
    if (!Array.isArray(comments)) return [];
    
    return comments.filter(comment =>
      comment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.article?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [comments, searchTerm]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    if (!Array.isArray(comments)) {
      return {
        totalComments: 0,
        todayComments: 0,
        uniqueArticles: 0
      };
    }
    
    const today = new Date().toDateString();
    const todayComments = comments.filter(c => {
      const commentDate = new Date(c.createdAt).toDateString();
      return today === commentDate;
    }).length;
    
    const uniqueArticles = new Set(comments.map(c => c.articleSlug)).size;
    
    return {
      totalComments: comments.length,
      todayComments,
      uniqueArticles
    };
  }, [comments]);

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, ...commentData }) => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.put(`${apiUrl}/comments/admin/${id}`, commentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-comments']);
      toast({
        title: "टिप्पणी अपडेट किया गया",
        description: "टिप्पणी सफलतापूर्वक अपडेट किया गया है",
      });
      setIsDialogOpen(false);
      setEditingComment(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "टिप्पणी अपडेट करने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('adminAuthToken');
      await axios.delete(`${apiUrl}/comments/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-comments']);
      toast({
        title: "टिप्पणी हटाया गया",
        description: "टिप्पणी सफलतापूर्वक हटाया गया है",
      });
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "टिप्पणी हटाने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setCommenterName("");
    setCommentText("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!commentText.trim() || !commenterName.trim()) {
      toast({
        title: "त्रुटि",
        description: "कृपया नाम और टिप्पणी दर्ज करें",
        variant: "destructive",
      });
      return;
    }

    updateCommentMutation.mutate({
      id: editingComment.id,
      name: commenterName.trim(),
      text: commentText.trim(),
    });
  };

  const handleEdit = (comment) => {
    setEditingComment(comment);
    setCommenterName(comment.name);
    setCommentText(comment.text);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("क्या आप इस टिप्पणी को हटाना चाहते हैं?")) {
      deleteCommentMutation.mutate(id);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      // console.log('No date string provided');
      return 'Invalid Date';
    }
    
    // console.log('Formatting date:', dateString, 'Type:', typeof dateString);
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      // console.log('Invalid date value:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
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
          <h2 className="text-lg font-semibold mb-2">टिप्पणियां लोड करने में त्रुटि</h2>
          <p className="text-sm mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            पेज रिफ्रेश करें
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">टिप्पणी प्रबंधन</h1>
          <p className="text-muted-foreground">लेखों पर की गई टिप्पणियों को प्रबंधित करें</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">कुल टिप्पणियां</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">सभी लेखों पर</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">आज की टिप्पणियां</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.todayComments}
            </div>
            <p className="text-xs text-muted-foreground">आज जोड़ी गई</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">सक्रिय लेख</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.uniqueArticles}
            </div>
            <p className="text-xs text-muted-foreground">टिप्पणियों के साथ</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="टिप्पणियां खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>टिप्पणी सूची</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>टिप्पणीकर्ता</TableHead>
                <TableHead>टिप्पणी</TableHead>
                <TableHead>लेख</TableHead>
                <TableHead>तिथि</TableHead>
                <TableHead>क्रियाएं</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.length > 0 ? (
                filteredComments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div className="font-medium">{comment.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={comment.text}>
                        {comment.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{comment.article?.title || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{comment.articleSlug}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(comment.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(comment)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">कोई टिप्पणी नहीं मिली</p>
                      <p className="text-sm">अभी तक कोई टिप्पणी नहीं है या खोज के अनुसार कोई परिणाम नहीं मिला।</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Comment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>टिप्पणी संपादित करें</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                नाम
              </label>
              <Input
                id="name"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="text" className="text-right">
                टिप्पणी
              </label>
              <textarea
                id="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="col-span-3 min-h-[100px] p-2 border rounded-md"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateCommentMutation.isPending}>
              {updateCommentMutation.isPending ? "अपडेट कर रहे हैं..." : "अपडेट करें"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminComments; 