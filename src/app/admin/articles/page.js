'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'

const fetchArticles = async ({ queryKey }) => {
  const [, { search }] = queryKey
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const response = await axios.get(`${apiUrl}/news`, { params: { limit: 10, offset: 0, search } })
  return response.data
}

const deleteArticle = async (id) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null
  const response = await axios.delete(`${apiUrl}/news/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  return response.data
}

export default function AdminArticles() {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', { search: searchTerm }],
    queryFn: fetchArticles,
    retry: false,
  })

  const articles = data?.articles || []

  const deleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries(['articles'])
      toast({ title: 'लेख हटाया गया', description: 'लेख सफलतापूर्वक हटा दिया गया है' })
    },
    onError: (error) => {
      toast({ title: 'लेख हटाने में त्रुटि', description: error.response?.data?.message || 'कुछ गलत हो गया', variant: 'destructive' })
    },
  })

  useEffect(() => {
    if (error) toast({ title: 'लेख लोड करने में त्रुटि', description: error.response?.data?.message || 'कुछ गलत हो गया', variant: 'destructive' })
  }, [error, toast])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">लेख प्रबंधन</h1>
          <p className="text-muted-foreground">अपने समाचार लेखों को प्रबंधित करें</p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark" onClick={() => router.push('/admin/articles/new')}>
          <Plus className="w-4 h-4 mr-2" />नया लेख बनाएं
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">कुल लेख</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{articles.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">प्रकाशित</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{articles.filter(a => !a.is_draft).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">ड्राफ्ट</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{articles.filter(a => a.is_draft).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">कुल व्यूज</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-accent">{articles.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString()}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="लेख खोजें..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>लेख सूची</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div>Loading...</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>शीर्षक</TableHead><TableHead>श्रेणी</TableHead><TableHead>लेखक</TableHead>
                  <TableHead>स्थिति</TableHead><TableHead>प्रकाशन समय</TableHead><TableHead>व्यूज</TableHead><TableHead>क्रियाएं</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length > 0 ? articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium max-w-xs"><div className="line-clamp-2">{article.title}</div></TableCell>
                    <TableCell><Badge variant="outline">{article.category || 'N/A'}</Badge></TableCell>
                    <TableCell>{article.author_name}</TableCell>
                    <TableCell><Badge variant={article.is_breaking ? 'destructive' : 'default'}>{article.is_breaking ? 'ब्रेकिंग' : 'प्रकाशित'}</Badge></TableCell>
                    <TableCell>{new Date(article.created_at).toLocaleString('hi-IN')}</TableCell>
                    <TableCell>{(article.views || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/news/${article.slug}`)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/articles/edit/${article.slug}`)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(article.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan="7" className="text-center py-8 text-gray-500">कोई लेख नहीं मिला</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
