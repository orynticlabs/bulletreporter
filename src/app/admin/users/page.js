'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Plus, Search, UserCheck, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from '@/hooks/use-toast';
import axios from "axios";

// Role translation helper
const getRoleInHindi = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'एडमिन';
    case 'USER':
      return 'उपयोगकर्ता';
    default:
      return role;
  }
};

function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("USER");
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.get(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.post(`${apiUrl}/auth/register`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({
        title: "उपयोगकर्ता बनाया गया",
        description: "नया उपयोगकर्ता सफलतापूर्वक जोड़ा गया है",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "उपयोगकर्ता बनाने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  // Create admin user mutation
  const createAdminUserMutation = useMutation({
    mutationFn: async (userData) => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.post(`${apiUrl}/auth/admin-register`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({
        title: "एडमिन उपयोगकर्ता बनाया गया",
        description: "नया एडमिन उपयोगकर्ता सफलतापूर्वक जोड़ा गया है",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "एडमिन उपयोगकर्ता बनाने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }) => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.put(`${apiUrl}/users/${id}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({
        title: "उपयोगकर्ता अपडेट किया गया",
        description: "उपयोगकर्ता सफलतापूर्वक अपडेट किया गया है",
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "उपयोगकर्ता अपडेट करने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('adminAuthToken');
      await axios.delete(`${apiUrl}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({
        title: "उपयोगकर्ता हटाया गया",
        description: "उपयोगकर्ता सफलतापूर्वक हटाया गया है",
      });
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "उपयोगकर्ता हटाने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleInHindi(user.role).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setUserName("");
    setUserEmail("");
    setUserRole("USER");
    setUserPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation for new user creation (including admin)
    if (!editingUser) {
      if (userPassword !== confirmPassword) {
        toast({
          title: "त्रुटि",
          description: "पासवर्ड मेल नहीं खाते",
          variant: "destructive",
        });
        return;
      }
      if (userRole === "ADMIN") {
        createAdminUserMutation.mutate({
          name: userName,
          email: userEmail,
          password: userPassword
        });
      } else {
        createUserMutation.mutate({
          name: userName,
          email: userEmail,
          role: userRole,
          password: userPassword
        });
      }
    } else {
      // Existing user update logic
      const updateData = {
        id: editingUser.id,
        name: userName,
        email: userEmail,
        role: userRole
      };
      if (userPassword) {
        updateData.password = userPassword;
      }
      updateUserMutation.mutate(updateData);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserPassword("");
    setConfirmPassword("");
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("क्या आप इस उपयोगकर्ता को हटाना चाहते हैं?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingUser(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
          उपयोगकर्ता लोड करने में त्रुटि: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">उपयोगकर्ता प्रबंधन</h1>
          <p className="text-muted-foreground">टीम के सदस्यों और उनकी अनुमतियों को प्रबंधित करें</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              नया उपयोगकर्ता जोड़ें
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "उपयोगकर्ता संपादित करें" : "नया उपयोगकर्ता जोड़ें"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  नाम
                </Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  ईमेल
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              
              {/* Password fields - Always render but conditionally show/hide */}
              <div className="grid grid-cols-4 items-center gap-4" style={{ display: editingUser ? 'none' : 'grid' }}>
                <Label htmlFor="password" className="text-right">
                  पासवर्ड
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="col-span-3"
                  required={!editingUser}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4" style={{ display: editingUser ? 'none' : 'grid' }}>
                <Label htmlFor="confirmPassword" className="text-right">
                  पासवर्ड की पुष्टि करें
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="col-span-3"
                  required={!editingUser}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  भूमिका
                </Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="भूमिका चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">उपयोगकर्ता</SelectItem>
                    <SelectItem value="ADMIN">एडमिन</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createUserMutation.isPending || createAdminUserMutation.isPending || updateUserMutation.isPending}>
                {editingUser ? "अपडेट करें" : "जोड़ें"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">कुल उपयोगकर्ता</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{users.length}</div>
            <p className="text-xs text-muted-foreground">पंजीकृत सदस्य</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">सक्रिय</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.length}
            </div>
            <p className="text-xs text-muted-foreground">सभी उपयोगकर्ता</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">एडमिन</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {users.filter(u => u.role === "ADMIN").length}
            </div>
            <p className="text-xs text-muted-foreground">प्रशासक</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">उपयोगकर्ता</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {users.filter(u => u.role === "USER").length}
            </div>
            <p className="text-xs text-muted-foreground">नियमित उपयोगकर्ता</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="उपयोगकर्ता खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>उपयोगकर्ता सूची</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>उपयोगकर्ता</TableHead>
                <TableHead>भूमिका</TableHead>
                <TableHead>स्थिति</TableHead>
                <TableHead>शामिल हुआ</TableHead>
                <TableHead>अपडेट</TableHead>
                <TableHead>क्रियाएं</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {getRoleInHindi(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      <UserCheck className="w-3 h-3 mr-1" />
                      सक्रिय
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsers;