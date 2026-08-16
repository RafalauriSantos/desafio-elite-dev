import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QRScanner } from '../components/QRScanner';
import { api } from '../lib/api';

const cameraCallbacks: Array<(text: string) => Promise<void>> = [];
const start = vi.fn(async (_cameraId: string, _config: unknown, onDecoded: (text: string) => Promise<void>) => {
  cameraCallbacks.push(onDecoded);
});
const stop = vi.fn(async () => undefined);
const clear = vi.fn(async () => undefined);
const pause = vi.fn(async () => undefined);
const resume = vi.fn(() => undefined);

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class MockHtml5Qrcode {
    static getCameras = vi.fn(async () => [{ id: 'back-camera', label: 'Câmera traseira' }]);
    isScanning = true;
    start = start;
    stop = stop;
    clear = clear;
    pause = pause;
    resume = resume;
  }
}));

describe('QRScanner camera flow', () => {
  beforeEach(() => {
    cameraCallbacks.length = 0;
    start.mockClear();
    stop.mockClear();
    clear.mockClear();
    pause.mockClear();
    resume.mockClear();
    vi.spyOn(api, 'validateTicket').mockResolvedValue({
      success: true,
      valid: true,
      code: 'VALID',
      message: 'ENTRADA LIBERADA!'
    });
  });

  it('starts the selected camera and de-duplicates repeated QR frames', async () => {
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<QRScanner onResult={onResult} targetEventId="all" />);

    await user.click(screen.getByRole('button', { name: /Escanear/i }));

    await waitFor(() => expect(start).toHaveBeenCalledWith(
      'back-camera',
      expect.objectContaining({ fps: 10 }),
      expect.any(Function),
      expect.any(Function)
    ));

    await Promise.all([cameraCallbacks[0]('{"ticketId":"ticket-1"}'), cameraCallbacks[0]('{"ticketId":"ticket-1"}')]);

    expect(api.validateTicket).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: /ACESSO AUTORIZADO|ENTRADA LIBERADA/i })).toBeInTheDocument();
  });
});
