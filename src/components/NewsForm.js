'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import QuillWrapper from '@/components/QuillWrapper';
import imageCompression from 'browser-image-compression';
import { debounce } from 'lodash';

const NewsForm = ({ isEditMode = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { id: slugParam } = useParams();
  const [articleId, setArticleId] = useState(null);
  const { toast } = useToast();
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${apiUrl}/categories`);
        return response.data;
      } catch (error) {
        // console.error('Error fetching categories:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    if (isEditMode && slugParam) {
      const fetchArticle = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const response = await axios.get(`${apiUrl}/news/${slugParam}`);
          const article = response.data;
          setArticleId(article.id);
          setTitle(article.title);
          setDescription(article.description);
          setYoutubeUrl(article.youtube_url || '');
          setIsBreaking(article.is_breaking);
          setAuthorName(article.author_name);
          setCategory(article.category || '');
          if (article.imageUrl) {
            setImage(article.imageUrl);
            setImagePreview(article.imageUrl);
          }
          setTags(article.tags || []);
        } catch (error) {
          // console.error('Fetch article error:', error.response?.data || error.message);
          toast({
            title: 'लेख लोड करने में त्रुटि',
            description: error.response?.data?.message || 'कुछ गलत हो गया',
            variant: 'destructive',
          });
        }
      };
      fetchArticle();
    }
  }, [isEditMode, slugParam, toast]);

  const handleImageChange = debounce(async (file) => {
    if (file) {
      try {
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          // console.log('Compressed image size:', compressedFile.size / 1024, 'KB');
          setImage(reader.result);
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        toast({
          title: 'छवि संपीड़न त्रुटि',
          description: 'छवि को संपीड़ित करने में असफल',
          variant: 'destructive',
        });
      }
    }
  }, 300);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const payload = {
        title,
        description: description.replace(/<p>/g, '').replace(/<\/p>/g, ''), // Strip <p> tags
        image,
        youtube_url: youtubeUrl,
        is_breaking: isBreaking,
        author_name: authorName,
        category,
      };

      const payloadSize = JSON.stringify(payload).length / 1024;
      // console.log('Payload size:', payloadSize, 'KB');
      if (payloadSize > 9000) {
        throw new Error('Payload too large. Reduce description or image size.');
      }

      const response = isEditMode
        ? await axios.put(`${apiUrl}/news/${articleId}`, { ...payload, tags }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000,
          })
        : await axios.post(`${apiUrl}/news`, { ...payload, tags }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000,
          });

      toast({
        title: isEditMode ? 'लेख अपडेट किया गया' : 'लेख बनाया गया',
        description: `लेख सफलतापूर्वक ${isEditMode ? 'अपडेट' : 'प्रकाशित'} हो गया है`,
      });

      router.push('/admin/articles');
    } catch (error) {
      // console.error('News form error:', JSON.stringify(error.response?.data || error.message, null, 2));
      const errorMessage =
        error.name === 'TimeoutError'
          ? 'Request timed out. Please try again with a smaller image or description.'
          : error.response?.data?.message || 'कुछ गलत हो गया';
      toast({
        title: `लेख ${isEditMode ? 'अपडेट' : 'बनाने'} में त्रुटि`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getYouTubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Handle editor focus
  const handleEditorFocus = () => {
    // This will be called when the editor container is clicked
    const editorElement = document.querySelector('.ql-editor');
    if (editorElement) {
      editorElement.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                📝
              </div>
              {isEditMode ? 'Edit Article' : 'Create a new article'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Section */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the title of the article"
                  required
                  className="text-lg p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300"
                />
              </div>

              {/* Description Section - FIXED */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  Description
                </Label>
                <div 
                  className="border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200 transition-all duration-300 min-h-[300px] cursor-text"
                  onClick={handleEditorFocus}
                >
                  <QuillWrapper
                    value={description}
                    onChange={setDescription}
                    theme="snow"
                    placeholder="लेख का विवरण दर्ज करें"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean'],
                        [{ 'align': [] }],
                        [{ 'color': [] }, { 'background': [] }]
                      ]
                    }}
                    formats={[
                      'header',
                      'bold', 'italic', 'underline', 'strike',
                      'list', 'bullet',
                      'link', 'image',
                      'align',
                      'color', 'background'
                    ]}
                    style={{
                      minHeight: '280px'
                    }}
                  />
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Category */}
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      Category
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-2 bg-white z-50">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Author */}
                  <div className="space-y-3">
                    <Label htmlFor="authorName" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      Author Name
                    </Label>
                    <Input
                      id="authorName"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Enter author name"
                      required
                      className="p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <Label htmlFor="tags" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      Tags
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tags (e.g., sports, politics)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1 p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300"
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddTag}
                        className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all duration-300"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-all duration-300">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 text-red-600 hover:text-red-800 font-bold"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Breaking News */}
                  <div className="space-y-3">
                    <Label htmlFor="isBreaking" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      Breaking News
                    </Label>
                    <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <Switch
                        id="isBreaking"
                        checked={isBreaking}
                        onCheckedChange={setIsBreaking}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <Label htmlFor="isBreaking" className="text-sm text-gray-600">
                        Mark as breaking news
                      </Label>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      Upload Image
                    </Label>
                    <div className="space-y-4">
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                          dragActive 
                            ? 'border-red-500 bg-red-50' 
                            : youtubeUrl 
                            ? 'border-gray-300 bg-gray-100' 
                            : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                        } ${youtubeUrl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !youtubeUrl && document.getElementById('fileInput').click()}
                      >
                        <input
                          id="fileInput"
                          type="file"
                          accept="image/*"
                          onChange={handleFileInput}
                          disabled={youtubeUrl}
                          className="hidden"
                        />
                        
                        {imagePreview ? (
                          <div className="relative">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="max-w-full h-48 object-cover rounded-lg mx-auto shadow-md"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage();
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-700 mb-2">
                              {dragActive ? 'Drop image here' : 'Choose File'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {youtubeUrl ? 'Disabled when YouTube link is provided' : 'Drag and drop or click to select'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* YouTube URL */}
                  <div className="space-y-3">
                    <Label htmlFor="youtubeUrl" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      YouTube Link
                    </Label>
                    <Input
                      id="youtubeUrl"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="Enter YouTube video link"
                      disabled={image}
                      className="p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300"
                    />
                    {youtubeUrl && getYouTubeEmbedUrl(youtubeUrl) && (
                      <div className="mt-4 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                        <iframe
                          width="100%"
                          height="200"
                          src={getYouTubeEmbedUrl(youtubeUrl)}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-8">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-12 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Publishing...
                    </div>
                  ) : (
                    isEditMode ? 'Update Article' : 'Publish Article'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="bg-gray-50 rounded-b-lg p-6">
            <div className="flex justify-end gap-4 w-full">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/articles')}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default NewsForm;