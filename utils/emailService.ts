
import { Shipment, Milestone } from '../types';

/**
 * Llama al backend para enviar un correo electrónico de alerta.
 */
export const sendAlertEmail = async (shipment: Shipment, milestone: Milestone): Promise<boolean> => {
  try {
    const response = await fetch('/api/notify/milestone-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shipment, milestone }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al enviar email de alerta:', errorData.error);
      return false;
    }

    const data = await response.json();
    console.log(`%c 📧 NOTIFICACIÓN ENVIADA AL BACKEND `, 'background: #10b981; color: white; font-weight: bold; padding: 2px 4px; border-radius: 4px;', data.message);
    return true;
  } catch (error) {
    console.error('Error de red al intentar enviar email de alerta:', error);
    return false;
  }
};
