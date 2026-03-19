import React, { useState, useEffect } from 'react';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { Button } from 'twenty-ui';

export const SettingsWhatsapp = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessionStatus = async () => {
    try {
      const wahaUrl = process.env.REACT_APP_WAHA_URL || 'http://localhost:3000';
      const sessionName = 'default';
      
      const response = await fetch(`${wahaUrl}/api/sessions/${sessionName}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      } else {
        setStatus('not_found');
      }
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

      await fetch(`${wahaUrl}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName })
      });
      
      setTimeout(() => fetchSessionStatus(), 5000);
      
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
              <p>Scan the QR code below con tu app de WhatsApp:</p>
              <img src={qrCode} alt="WhatsApp QR Code" />
            </div>
          )}
          
          {status === 'CONNECTED' && (
            <div style={{ marginTop: 20, color: 'green' }}>
              <p>¡Tu cuenta de WhatsApp se encuentra enlazada y configurada exitosamente!</p>
            </div>
          )}
        </div>
      </PageBody>
    </SettingsPageContainer>
  );
};
