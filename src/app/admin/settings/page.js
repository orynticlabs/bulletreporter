'use client'

import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getWhatsappGroupLink, updateWhatsappGroupLink } from '@/services/settingService';

const SettingsPage = () => {
  const [whatsappLink, setWhatsappLink] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchWhatsappLink = async () => {
      try {
        const link = await getWhatsappGroupLink();
        setWhatsappLink(link);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch WhatsApp group link.",
          variant: "destructive",
        });
      }
    };
    fetchWhatsappLink();
  }, [toast]);

  const handleSaveWhatsappLink = async () => {
    try {
      await updateWhatsappGroupLink(whatsappLink);
      toast({
        title: "Success",
        description: "WhatsApp group link updated successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update WhatsApp group link.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
        color: "hsl(0, 0%, 15%)", // --foreground
      }}
    >
      <h1
        style={{
          fontSize: "1.875rem",
          fontWeight: "700",
          color: "hsl(350, 85%, 45%)", // --primary
        }}
      >
        सेटिंग्स
      </h1>

      <Card
        style={{
          background: "hsl(0, 0%, 100%)", // --card
          borderRadius: "0.75rem",
          boxShadow: "0 4px 12px hsl(0, 0%, 0%, 0.1)", // --shadow-news-card
          border: "1px solid hsl(0, 0%, 90%)", // --border
        }}
      >
        <CardHeader>
          <CardTitle
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "hsl(350, 85%, 45%)", // --primary
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Settings style={{ width: "20px", height: "20px" }} />
            सामान्य सेटिंग्स
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <Label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "hsl(0, 0%, 15%)", // --foreground
                }}
              >
                साइट का नाम
              </Label>
              <Input
                placeholder="न्यूज़ वेबसाइट"
                style={{
                  background: "hsl(0, 0%, 96%)", // --input
                  border: "1px solid hsl(0, 0%, 90%)", // --border
                  borderRadius: "0.25rem",
                  padding: "8px",
                  marginTop: "4px",
                }}
              />
            </div>
            <div>
              <Label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "hsl(0, 0%, 15%)", // --foreground
                }}
              >
                थीम रंग
              </Label>
              <Input
                placeholder="hsl(350, 85%, 45%)"
                style={{
                  background: "hsl(0, 0%, 96%)", // --input
                  border: "1px solid hsl(0, 0%, 90%)", // --border
                  borderRadius: "0.25rem",
                  padding: "8px",
                  marginTop: "4px",
                }}
              />
            </div>
            {/* WhatsApp Group Link */} 
            <div>
              <Label
                htmlFor="whatsapp-link"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "hsl(0, 0%, 15%)",
                }}
              >
                WhatsApp समूह लिंक
              </Label>
              <Input
                id="whatsapp-link"
                type="url"
                placeholder="https://chat.whatsapp.com/your-group-link"
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                style={{
                  background: "hsl(0, 0%, 96%)",
                  border: "1px solid hsl(0, 0%, 90%)",
                  borderRadius: "0.25rem",
                  padding: "8px",
                  marginTop: "4px",
                }}
              />
            </div>
            <Button
              onClick={handleSaveWhatsappLink}
              style={{
                background: "hsl(350, 85%, 45%)", // --primary
                color: "hsl(0, 0%, 100%)", // --primary-foreground
                padding: "8px 16px",
                borderRadius: "0.5rem",
                marginTop: "16px",
              }}
            >
              सहेजें
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;