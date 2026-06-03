import api from './api';

export const getWhatsappGroupLink = async () => {
  try {
    const response = await api.get('/settings/whatsapp');
    return response.data.whatsappGroupLink;
  } catch (error) {
    // console.error('Error fetching WhatsApp group link:', error);
    throw error;
  }
};

export const updateWhatsappGroupLink = async (link) => {
  try {
    const response = await api.post('/settings/whatsapp', { whatsappGroupLink: link });
    return response.data;
  } catch (error) {
    // console.error('Error updating WhatsApp group link:', error);
    throw error;
  }
}; 