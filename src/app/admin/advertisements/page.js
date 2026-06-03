'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { debounce } from 'lodash';

const fetchAdvertisements = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('adminAuthToken');
  const response = await axios.get(`${apiUrl}/advertisements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const createAdvertisement = async (newAd) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('adminAuthToken');
  const response = await axios.post(`${apiUrl}/advertisements`, newAd, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const updateAdvertisement = async (updatedAd) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('adminAuthToken');
  const response = await axios.put(`${apiUrl}/advertisements/${updatedAd.id}`, updatedAd, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const deleteAdvertisement = async (id) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem('adminAuthToken');
  const response = await axios.delete(`${apiUrl}/advertisements/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const AdminAdvertisements = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [placement, setPlacement] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: advertisements, isLoading, error } = useQuery({
    queryKey: ['advertisements'],
    queryFn: fetchAdvertisements,
  });

  const createMutation = useMutation({
    mutationFn: createAdvertisement,
    onSuccess: () => {
      queryClient.invalidateQueries(['advertisements']);
      toast({
        title: 'विज्ञापन बनाया गया',
        description: 'विज्ञापन सफलतापूर्वक बनाया गया है।',
      });
      resetForm();
    },
    onError: (err) => {
      toast({
        title: 'विज्ञापन बनाने में त्रुटि',
        description: err.response?.data?.message || 'कुछ गलत हो गया',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdvertisement,
    onSuccess: () => {
      queryClient.invalidateQueries(['advertisements']);
      toast({
        title: 'विज्ञापन अपडेट किया गया',
        description: 'विज्ञापन सफलतापूर्वक अपडेट किया गया है।',
      });
      resetForm();
    },
    onError: (err) => {
      toast({
        title: 'विज्ञापन अपडेट करने में त्रुटि',
        description: err.response?.data?.message || 'कुछ गलत हो गया',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdvertisement,
    onSuccess: () => {
      queryClient.invalidateQueries(['advertisements']);
      toast({
        title: 'विज्ञापन हटाया गया',
        description: 'विज्ञापन सफलतापूर्वक हटा दिया गया है।',
      });
    },
    onError: (err) => {
      toast({
        title: 'विज्ञापन हटाने में त्रुटि',
        description: err.response?.data?.message || 'कुछ गलत हो गया',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (editingAd) {
      setTitle(editingAd.title);
      setImage(editingAd.imageUrl || null);
      setImagePreview(editingAd.imageUrl || null);
      setLinkUrl(editingAd.linkUrl);
      setPlacement(editingAd.placement);
      setIsActive(editingAd.isActive);
      setIsFormOpen(true);
      setFormKey(prev => prev + 1);
    } else {
      resetForm();
    }
  }, [editingAd]);

  const resetForm = () => {
    setEditingAd(null);
    setTitle('');
    setImage(null);
    setImagePreview(null);
    setLinkUrl('');
    setPlacement('');
    setIsActive(true);
    setIsFormOpen(false);
    setFormKey(prev => prev + 1);
  };

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

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const adData = {
      title,
      imageUrl: image || null,
      linkUrl,
      placement,
      isActive,
    };

    if (editingAd) {
      updateMutation.mutate({ ...adData, id: editingAd.id });
    } else {
      // Check if there's already an ad in this placement
      const existingAd = advertisements?.find(ad => ad.placement === placement && ad.isActive);
      
      if (existingAd) {
        // Show confirmation dialog
        if (window.confirm(`इस प्लेसमेंट (${placement}) में पहले से ही एक सक्रिय विज्ञापन है। क्या आप इसे नए विज्ञापन से बदलना चाहते हैं?`)) {
          // First deactivate the existing ad, then create the new one
          updateMutation.mutate({ 
            ...existingAd, 
            isActive: false 
          }, {
            onSuccess: () => {
              // After deactivating, create the new ad
              createMutation.mutate(adData);
            }
          });
        }
      } else {
        // No existing ad in this placement, create normally
      createMutation.mutate(adData);
      }
    }
  };

  const getAdPreviewClasses = (placement) => {
    switch (placement) {
      case 'top_banner':
      case 'middle_banner':
      case 'bottom_banner':
        return 'h-24 md:h-32';
      case 'sidebar':
        return 'h-32 w-full max-w-sm';
      case 'bottom_sidebar':
        return 'h-64 w-full max-w-sm';
      default:
        return 'h-24';
    }
  };

  const handlePlacementChange = (value) => {
    setPlacement(value);
  };

  if (error) {
    toast({
      title: 'विज्ञापन लोड करने में त्रुटि',
      description: error.message || 'कुछ गलत हो गया',
      variant: 'destructive',
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">विज्ञापन प्रबंधन</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> नया विज्ञापन जोड़ें
        </Button>
      </div>

      {isFormOpen && (
        <Card key={formKey}>
          <CardHeader>
            <CardTitle>{editingAd ? 'विज्ञापन संपादित करें' : 'नया विज्ञापन जोड़ें'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">शीर्षक</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="विज्ञापन शीर्षक दर्ज करें"
                  required
                  className="p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkUrl">लिंक URL</Label>
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="विज्ञापन के लिए लिंक URL दर्ज करें"
                  required
                  className="p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  विज्ञापन छवि अपलोड करें
                </Label>
                <div className="space-y-4">
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                    } cursor-pointer`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    
                    {imagePreview ? (
                      <div className="space-y-4">
                        {/* Original Image Preview */}
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Original Preview" 
                            className="max-w-full h-48 object-contain bg-gray-50 rounded-lg mx-auto shadow-md border"
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
                        
                        {/* Ad Space Preview */}
                        {placement && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">विज्ञापन स्थान में दिखेगा:</p>
                            <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden ${getAdPreviewClasses(placement)}`}>
                              <img 
                                src={imagePreview} 
                                alt="Ad Preview" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              छवि पूरी तरह से फिट होगी, क्रॉपिंग नहीं होगी
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          {dragActive ? 'छवि यहाँ छोड़ें' : 'फ़ाइल चुनें'}
                        </p>
                        <p className="text-sm text-gray-500">
                          ड्रैग और ड्रॉप या क्लिक करके चुनें
                        </p>
                      </div>
                    )}
                  </div>
              </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placement">प्लेसमेंट</Label>
                <Select 
                  value={placement} 
                  onValueChange={handlePlacementChange}
                >
                  <SelectTrigger className="p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300 bg-white">
                    <SelectValue placeholder="विज्ञापन प्लेसमेंट चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top_banner" className="flex items-center justify-between">
                      <span>शीर्ष बैनर</span>
                      {advertisements?.find(ad => ad.placement === 'top_banner' && ad.isActive) && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">सक्रिय</span>
                      )}
                    </SelectItem>
                    <SelectItem value="middle_banner" className="flex items-center justify-between">
                      <span>मध्य बैनर</span>
                      {advertisements?.find(ad => ad.placement === 'middle_banner' && ad.isActive) && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">सक्रिय</span>
                      )}
                    </SelectItem>
                    <SelectItem value="bottom_banner" className="flex items-center justify-between">
                      <span>नीचे का बैनर</span>
                      {advertisements?.find(ad => ad.placement === 'bottom_banner' && ad.isActive) && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">सक्रिय</span>
                      )}
                    </SelectItem>
                    <SelectItem value="sidebar" className="flex items-center justify-between">
                      <span>साइडबार</span>
                      {advertisements?.find(ad => ad.placement === 'sidebar' && ad.isActive) && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">सक्रिय</span>
                      )}
                    </SelectItem>
                    <SelectItem value="bottom_sidebar" className="flex items-center justify-between">
                      <span>नीचे का साइडबार</span>
                      {advertisements?.find(ad => ad.placement === 'bottom_sidebar' && ad.isActive) && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">सक्रिय</span>
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {placement && advertisements?.find(ad => ad.placement === placement && ad.isActive) && (
                  <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>इस प्लेसमेंट में पहले से ही एक सक्रिय विज्ञापन है। नया विज्ञापन जोड़ने पर पुराना विज्ञापन निष्क्रिय हो जाएगा।</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-red-500"
                />
                <Label htmlFor="isActive">सक्रिय विज्ञापन</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-300"
                >
                  रद्द करें
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingAd ? 'अपडेट हो रहा है...' : 'जोड़ रहे हैं...'}
                    </div>
                  ) : (
                    editingAd ? 'विज्ञापन अपडेट करें' : 'विज्ञापन जोड़ें'
                  )}
              </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Advertisements Table */}
      <Card>
        <CardHeader>
          <CardTitle>विज्ञापन सूची</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>शीर्षक</TableHead>
                  <TableHead>छवि</TableHead>
                  <TableHead>प्लेसमेंट</TableHead>
                  <TableHead>लिंक</TableHead>
                  <TableHead>स्थिति</TableHead>
                  <TableHead>क्रियाएं</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advertisements && advertisements.length > 0 ? (
                  advertisements.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>
                        {ad.imageUrl ? (
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400">कोई छवि नहीं</span>
                        )}
                      </TableCell>
                      <TableCell>{ad.placement}</TableCell>
                      <TableCell>
                        <a 
                          href={ad.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          लिंक देखें
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ad.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ad.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAd(ad)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(ad.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>कोई विज्ञापन नहीं मिला</p>
                        <p className="text-sm">पहला विज्ञापन जोड़ने के लिए ऊपर दिए गए बटन पर क्लिक करें</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAdvertisements;