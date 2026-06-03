'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  generateSocialMediaPreview, 
  validateSocialSharingData,
  shareOnPlatform,
  optimizeImageForSocialSharing
} from '@/utils/socialSharing';
import { ExternalLink, Share2, CheckCircle, AlertCircle, Info } from 'lucide-react';

const SocialSharingTester = ({ article }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');
  const [showPreview, setShowPreview] = useState(false);

  if (!article || process.env.NODE_ENV === 'production') {
    return null;
  }

  const validation = validateSocialSharingData(article);
  const preview = generateSocialMediaPreview(article, selectedPlatform);

  const platforms = [
    { id: 'whatsapp', name: 'WhatsApp', color: 'bg-green-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-500' },
    { id: 'twitter', name: 'Twitter/X', color: 'bg-black' },
    { id: 'telegram', name: 'Telegram', color: 'bg-sky-500' }
  ];

  const handleTestShare = (platform) => {
    shareOnPlatform(platform, article);
  };

  const handleValidateImage = async () => {
    if (article.image_url) {
      try {
        const optimizedUrl = optimizeImageForSocialSharing(article.image_url);
        window.open(optimizedUrl, '_blank');
      } catch (error) {
        console.error('Error opening image:', error);
      }
    }
  };

  return (
    <Card className="mt-6 border-dashed border-orange-300 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Share2 className="w-5 h-5" />
          Social Media Sharing Tester
          <Badge variant="outline" className="text-xs">Development Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Validation Status:</h4>
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
              {validation.isValid ? 'Ready for sharing' : 'Issues found'}
            </span>
          </div>
          
          {validation.errors.length > 0 && (
            <div className="text-xs text-red-600 space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              ))}
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div className="text-xs text-yellow-600 space-y-1">
              {validation.warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Test Platform:</h4>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <Button
                key={platform.id}
                variant={selectedPlatform === platform.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlatform(platform.id)}
                className="text-xs"
              >
                {platform.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm text-gray-700">Preview:</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs"
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
          
          {showPreview && (
            <div className="border rounded-lg p-3 bg-white text-xs space-y-2">
              <div><strong>Title:</strong> {preview.title}</div>
              <div><strong>Description:</strong> {preview.description}</div>
              <div><strong>URL:</strong> {preview.url}</div>
              <div><strong>Image:</strong> 
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleValidateImage}
                  className="text-xs p-0 h-auto ml-1"
                >
                  View Image <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div><strong>Author:</strong> {preview.author}</div>
              <div><strong>Category:</strong> {preview.category}</div>
            </div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Test Sharing:</h4>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <Button
                key={platform.id}
                size="sm"
                onClick={() => handleTestShare(platform.id)}
                className="text-xs"
                disabled={!validation.isValid}
              >
                Test {platform.name}
              </Button>
            ))}
          </div>
        </div>

        {/* External Validation Tools */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">External Validation:</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(preview.url)}`, '_blank')}
              className="text-xs"
            >
              Facebook Debugger <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(preview.url)}`, '_blank')}
              className="text-xs"
            >
              Twitter Validator <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(preview.url)}`, '_blank')}
              className="text-xs"
            >
              LinkedIn Inspector <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 border-t pt-2">
          <p><strong>Note:</strong> This component only appears in development mode to help test social media sharing functionality.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialSharingTester;
