'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Plus, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from '@/hooks/use-toast';
import axios from "axios";

function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#dc2626");
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

  // Fetch categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.get(`${apiUrl}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.post(`${apiUrl}/categories`, categoryData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast({
        title: "श्रेणी बनाई गई",
        description: "नई श्रेणी सफलतापूर्वक जोड़ी गई है",
      });
      setIsDialogOpen(false);
      setCategoryName("");
      setCategoryColor("#dc2626");
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "श्रेणी बनाने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...categoryData }) => {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.put(`${apiUrl}/categories/${id}`, categoryData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast({
        title: "श्रेणी अपडेट की गई",
        description: "श्रेणी सफलतापूर्वक अपडेट की गई है",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setCategoryName("");
      setCategoryColor("#dc2626");
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "श्रेणी अपडेट करने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('adminAuthToken');
      await axios.delete(`${apiUrl}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast({
        title: "श्रेणी हटाई गई",
        description: "श्रेणी सफलतापूर्वक हटाई गई है",
      });
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: error.response?.data?.message || "श्रेणी हटाने में त्रुटि",
        variant: "destructive",
      });
    }
  });

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        name: categoryName,
        color: categoryColor
      });
    } else {
      createCategoryMutation.mutate({
        name: categoryName,
        color: categoryColor
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color || "#dc2626");
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("क्या आप इस श्रेणी को हटाना चाहते हैं?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryColor("#dc2626");
    setIsDialogOpen(true);
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
          श्रेणियां लोड करने में त्रुटि: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">श्रेणी प्रबंधन</h1>
          <p className="text-muted-foreground">समाचार श्रेणियों को व्यवस्थित करें</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              नई श्रेणी जोड़ें
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "श्रेणी संपादित करें" : "नई श्रेणी जोड़ें"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">श्रेणी नाम</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="श्रेणी का नाम दर्ज करें"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryColor">रंग</Label>
                <Input
                  id="categoryColor"
                  type="color"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCategory ? "अपडेट करें" : "जोड़ें"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">कुल श्रेणियां</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{categories.length}</div>
            <p className="text-xs text-muted-foreground">सक्रिय श्रेणियां</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">कुल लेख</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {/* Note: Article count per category would need to be calculated in backend */}
              -
            </div>
            <p className="text-xs text-muted-foreground">सभी श्रेणियों में</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">सबसे लोकप्रिय</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categories.length > 0 ? categories[0].name : "-"}
            </div>
            <p className="text-xs text-muted-foreground">सबसे पहली श्रेणी</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="श्रेणी खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 w-full h-2"
              style={{ backgroundColor: category.color || "#dc2626" }}
            />
            <CardHeader className="pt-6">
              <CardTitle className="flex items-center justify-between">
                <span>{category.name}</span>
                <Badge variant="outline">-</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Slug: {category.slug}</p>
                  <p className="text-sm text-muted-foreground">- लेख</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(category.id)}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>श्रेणी सूची</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>नाम</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>रंग</TableHead>
                <TableHead>लेख संख्या</TableHead>
                <TableHead>क्रियाएं</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: category.color || "#dc2626" }}
                      />
                      <span className="text-sm">{category.color || "#dc2626"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>-</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(category.id)}
                        disabled={deleteCategoryMutation.isPending}
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

export default AdminCategories;