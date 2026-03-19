import React, { useState, useEffect } from 'react';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { Button } from 'twenty-ui';
import axios from 'axios';

export const SettingsWhatsapp = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessionStatus = async () => {
    try {
      // Assuming WAHA running on local or accessible URL
      const wahaUrl = process.env.REACT_APP_WAHA_URL || 'http://localhost:3000';
      const sessionName = 'default'; // In a multi-tenant environment, this might be workspaceId
      
      const res = await axios.get(`${wahaUrl}/api/sessions/${sessionName}`);
      setStatus(res.data.status);
    } catch (error) {
      console.error('Failed to fetch WAHA session status', error);
      setStatus('error');
    }
  };

  const startSession = async () => {
    setIsLoading(true);
    try {
      const wahaUrl = process.env.REACT_APP_WAHA_URL || 'http://localhost:3000';
      const sessionName = 'default';

      // Start the session
      await axios.post(`${wahaUrl}/api/sessions/start`, { name: sessionName });
      
      // We would ideally listen for webhook or poll to get QR
      // For now, let's assume we can fetch it or wait for the user to scan
      setTimeout(() => fetchSessionStatus(), 5000);
      
      // Note: This is a placeholder since WAHA provides an endpoint for the QR image:
      setQrCode(`${wahaUrl}/api/default/auth/qr?format=image`);
    } catch (error) {
      console.error('Failed to start WAHA session', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  return (
    <SettingsPageContainer title="WhatsApp Integration">
      <PageBody>
        <div style={{ maxWidth: 600, padding: 24 }}>
          <h2>WhatsApp Connection (WAHA)</h2>
          <p>Status: {status}</p>

          {status !== 'CONNECTED' && (
            <Button onClick={startSession} disabled={isLoading}>
              {isLoading ? 'Starting...' : 'Connect WhatsApp'}
            </Button>
          )}

          {qrCode && status !== 'CONNECTED' && (
            <div style={{ marginTop: 20 }}>
              <p>Scan the QR code below with your WhatsApp mobile app:</p>
              <img src={qrCode} alt="WhatsApp QR Code" />
            </div>
          )}
          
          {status === 'CONNECTED' && (
            <div style={{ marginTop: 20, color: 'green' }}>
              <p>Your WhatsApp is successfully connected and ready to send messages!</p>
            </div>
          )}
        </div>
      </PageBody>
    </SettingsPageContainer>
  );
};
